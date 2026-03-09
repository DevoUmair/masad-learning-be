import Transaction from "../models/transaction.js";

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate("student", "name email")
            .populate("course", "title")
            .populate("instructor", "name");
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};