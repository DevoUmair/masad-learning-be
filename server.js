import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import bunnyRoutes from './routes/bunny.route.js';

dotenv.config();

connectDB();

import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use('/api/bunny', bunnyRoutes);



app.get("/", (req, res) => res.json({ message: "Server running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
