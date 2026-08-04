// Import your newly created service
const inventoryService = require('../services/inventory.service');

// GET /api/items/low-stock
const getLowStockItems = async (req, res, next) => {
    try {
        const lowStockItems = await inventoryService.fetchLowStockItems();

        res.status(200).json({
            success: true,
            count: lowStockItems.length,
            data: lowStockItems
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/items
const getAllItems = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const category = req.query.category;

        const skip = (page - 1) * limit;
        const { items, totalItems } = await inventoryService.fetchAllItems(search, category, skip, limit);

        res.status(200).json({
            success: true,
            meta: {
                totalItems,
                currentPage: page,
                itemsPerPage: limit,
                filtersApplied: { category, search }
            },
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/items
const createItem = async (req, res, next) => {
    try {
        const newItem = await inventoryService.createNewItem(req.body);

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLowStockItems,
    getAllItems,
    createItem
};