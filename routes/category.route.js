import express from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getCategories)
    .post(isAuthenticated, createCategory);

router.route("/:id")
    .get(getCategoryById)
    .put(isAuthenticated, updateCategory)
    .delete(isAuthenticated, deleteCategory);

export default router;
