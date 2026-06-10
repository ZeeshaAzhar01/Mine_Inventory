// Import your newly created service
const inventoryService = require('../services/inventory.service');

// GET /api/items/low-stock
const getLowStockItems = async (req, res) => {
    try {
        // 1. Controller calls the Service (The Kitchen)
        const lowStockItems = await inventoryService.fetchLowStockItems();

        // 2. Controller formats and sends the HTTP Response (The Waiter)
        res.status(200).json({
            success: true,
            count: lowStockItems.length,
            data: lowStockItems
        });
    } catch (error) {
        console.error("Error fetching low stock items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/items
const getAllItems = async (req, res) => {
    try {
        // Extract query parameters (with defaults)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const category = req.query.category;

        // Calculate pagination math
        const skip = (page - 1) * limit;

        // Call the service
        const { items, totalItems } = await inventoryService.fetchAllItems(search, category, skip, limit);

        // Send response
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
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/items
const createItem = async (req, res) => {
    try {
        // Call the service and pass the request body
        const newItem = await inventoryService.createNewItem(req.body);

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getLowStockItems,
    getAllItems,
    createItem
};