const categoryService = require("../services/categoryService");

const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.user._id, req.body);
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getCategoriesByRestaurant = async (req, res) => {
  try {
    const categories = await categoryService.getCategoriesByRestaurant(req.user._id);
    return res.status(200).json({ categories });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.user._id, req.params.id);
    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategoriesByRestaurant,
  deleteCategory,
};
