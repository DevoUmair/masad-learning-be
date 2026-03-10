import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import bunnyRoutes from './routes/bunny.route.js';

dotenv.config();

connectDB();

import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.route.js";
import categoryRoutes from "./routes/category.route.js";
import studentRoutes from "./routes/student.route.js";
import ratingRoutes from "./routes/rating.route.js";
import libraryRoutes from "./routes/library.routes.js";
import instructorRoutes from "./routes/instructor.route.js";
import certificateRoutes from "./routes/certificate.route.js";
import adminRoutes from "./routes/admin.route.js";
import stripeRoutes from "./routes/stripe.route.js";
import transactionRoutes from "./routes/transaction.route.js";
import promo from "./routes/promo.route.js";


const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));

app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use('/api/bunny', bunnyRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/payments", stripeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/promo", promo);




app.get("/", (req, res) => res.json({ message: "Server running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
