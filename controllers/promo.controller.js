
import Stripe from "stripe";
import Promo from '../models/promo.model.js'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripePromo = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        // 👉 Extract maxRedemptions from req.body
        const { codeName, percentOff, expiryDate, maxRedemptions } = req.body;

        if (!codeName || !percentOff || !expiryDate) {
            return res.status(400).json({ message: "Code name, discount percentage, and expiry date are required." });
        }

        const upperCode = codeName.toUpperCase().trim();

        const existingPromo = await Promo.findOne({ code: upperCode });
        if (existingPromo) {
            return res.status(400).json({ message: "Promo code already exists in your database." });
        }

        const expiresAtTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
        if (expiresAtTimestamp <= Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ message: "Expiry date must be in the future." });
        }

        const coupon = await stripe.coupons.create({
            percent_off: percentOff,
            duration: 'once',
        });

        // 👉 Set up the base Stripe params
        const promoCodeParams = {
            promotion: {            // <-- New required structure
                type: "coupon",
                coupon: coupon.id
            },
            code: upperCode,
            active: true,
            expires_at: expiresAtTimestamp
        };

        // 👉 Add max_redemptions to Stripe if the admin provided a number greater than 0
        if (maxRedemptions && Number(maxRedemptions) > 0) {
            promoCodeParams.max_redemptions = Number(maxRedemptions);
        }

        const promotionCode = await stripe.promotionCodes.create(promoCodeParams);

        // 👉 Save to MongoDB with the maxRedemptions limit AND the stripePromoId
        const newPromo = new Promo({
            code: upperCode,
            discountType: "percentage",
            discountValue: percentOff,
            isActive: true,
            expiryDate: new Date(expiryDate),
            maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
            stripePromoId: promotionCode.id // <--- HERE IS THE NEW LINE!
        });

        await newPromo.save();

        res.status(201).json({
            success: true,
            message: "Promo code created successfully!",
            promoCode: promotionCode.code
        });

    } catch (error) {
        console.error("Error creating Stripe promo:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getPromos = async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);

    } catch (error) {
        console.error("Error getting promos:", error);
        res.status(500).json({ message: error.message });
    }
}

export const togglePromoStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Not authorized" });

        const { id } = req.params; // MongoDB ID
        const promo = await Promo.findById(id);

        if (!promo) return res.status(404).json({ message: "Promo not found" });

        // Tell Stripe to flip the active status
        await stripe.promotionCodes.update(promo.stripePromoId, {
            active: !promo.isActive
        });

        // Update local database
        promo.isActive = !promo.isActive;
        await promo.save();

        res.status(200).json({
            success: true,
            message: `Promo code is now ${promo.isActive ? 'Active' : 'Inactive'}`
        });
    } catch (error) {
        console.error("Error updating promo:", error);
        res.status(500).json({ message: error.message });
    }
};
