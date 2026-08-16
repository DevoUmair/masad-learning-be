import Stripe from "stripe";
import User from '../models/user.model.js';
import Course from "../models/course.model.js";
import Transaction from "../models/transaction.js";
import Progress from "../models/progress.model.js";
import Promo from "../models/promo.model.js";
import { sendEnrollmentEmail } from "../utils/emailTemplates/enrollment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;



export const createCheckoutSession = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id; // Assuming auth middleware provides this

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const user = await User.findById(userId);
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "aed",
                        product_data: {
                            name: course.title,
                            description: course.description || "Course enrollment",
                        },
                        unit_amount: Math.round(course.price * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            allow_promotion_codes: true, // ENABLES STRIPE PROMO CODES ON CHECKOUT PAGE
            success_url: `${process.env.CLIENT_URL}/success?course_id=${course._id}`,
            cancel_url: `${process.env.CLIENT_URL}/courses/${course._id}`,
            metadata: {
                courseId: course._id.toString(),
                userId: userId.toString(),
                instructorId: course.instructor.toString(),
            },
        });
        console.log("Created Stripe Checkout Session:", session);
        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    console.log("Received Stripe Webhook Event:", req.body);
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { courseId, userId, instructorId } = session.metadata;

        try {
            const user = await User.findById(userId);
            const course = await Course.findById(courseId);

            console.log("Found User Context:", user ? "YES (ID: " + user._id + ")" : "NO");
            console.log("Found Course Context:", course ? "YES (ID: " + course._id + ")" : "NO");

            const isAlreadyEnrolled = user && user.enrolledCourses.includes(courseId);

            if (user && course && !isAlreadyEnrolled) {

                // 1. Enroll User
                user.enrolledCourses.push(courseId);
                await user.save();

                // 2. Update Course Stats
                course.totalStudents += 1;
                course.enrolledStudents.push(userId);
                await course.save();

                // 3. Update Instructor Stats
                await User.findByIdAndUpdate(instructorId, {
                    $inc: {
                        "instructorProfile.totalStudents": 1,
                        "instructorProfile.pendingPayout": session.amount_total / 100
                    }
                });

                // 4. Record Transaction
                const newTransaction = new Transaction({
                    student: userId,
                    course: courseId,
                    instructor: instructorId,
                    amount: session.amount_total / 100,
                    currency: session.currency || "USD",
                    paymentId: session.payment_intent,
                    status: "paid"
                });
                await newTransaction.save();

                // 5. Initialize Progress
                const newProgress = new Progress({
                    student: userId,
                    course: courseId
                });
                await newProgress.save();

                // 6. Track Promo Code Usage if Applicable
                if (session.total_details && session.total_details.amount_discount > 0) {
                    try {
                        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                            expand: ['total_details.breakdown']
                        });

                        if (expandedSession?.total_details?.breakdown?.discounts) {
                            for (let disc of expandedSession.total_details.breakdown.discounts) {
                                // Extract the string ID of the promotion code applied
                                const promoCodeId = disc.discount?.promotion_code;
                                if (promoCodeId) {
                                    const promoCodeIdString = typeof promoCodeId === 'string' ? promoCodeId : promoCodeId.id;
                                    await Promo.findOneAndUpdate(
                                        { stripePromoId: promoCodeIdString },
                                        { $inc: { currentRedemptions: 1 } }
                                    );
                                    console.log(`Promo ${promoCodeIdString} redemption incremented locally.`);
                                }
                            }
                        }
                    } catch (promoErr) {
                        console.error("Failed to track local promo redemptions:", promoErr);
                    }
                }

                // 7. Send Enrollment Email (non-blocking)
                sendEnrollmentEmail(user.email, user.name, course.title, session.amount_total / 100)
                    .catch(err => console.error("Enrollment Email Error:", err));

                console.log("Enrollment successfully processed in Webhook!");
            } else {
                console.log("Enrollment bypassed in webhook. Reason:");
                if (!user) console.log("- User not found in DB");
                if (!course) console.log("- Course not found in DB");
                if (isAlreadyEnrolled) console.log("- User already enrolled");
            }
        } catch (error) {
            console.error("Error processing enrollment in webhook:", error);
        }
    }

    res.status(200).send().end();
};