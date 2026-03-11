import Category from "../models/category.js";

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ success: false, message: "Category name already exists" });
        }

        const category = new Category({ name, description });
        const createdCategory = await category.save();

        res.status(201).json({ success: true, message: "Category created", category: createdCategory });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ success: false, message: "Server error creating category" });
    }
};


export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ success: false, message: "Server error fetching categories" });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, category });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ success: false, message: "Server error fetching category" });
    }
};


export const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;

        const updatedCategory = await category.save();

        res.status(200).json({ success: true, message: "Category updated", category: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false, message: "Server error updating category" });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await Category.deleteOne({ _id: category._id });

        res.status(200).json({ success: true, message: "Category removed" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, message: "Server error deleting category" });
    }
};
