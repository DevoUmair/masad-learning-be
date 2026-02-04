import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: ["http://localhost:3000" ], credentials: true }));
app.use(express.json({ limit: "10mb" }));


app.get("/", (req, res) => res.json({ message: "Server running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
