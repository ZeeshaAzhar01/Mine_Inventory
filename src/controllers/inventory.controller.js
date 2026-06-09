const prisma = require('../config/prisma');

// CREATE: Add a new inventory item (Admin Only)
const createItem = async (req, res) => {
    try {
        const { name, category, stock_qty, unit_price, gst_rate, supplier_id } = req.body;

        // Basic validation
        if (!name || !supplier_id) {
            return res.status(400).json({ error: "Name and supplier_id are required" });
        }

        const item = await prisma.inventoryItem.create({
            data: {
                name,
                category,
                stock_qty: stock_qty || 0,
                unit_price,
                gst_rate,
                supplier_id
            }
        });

        res.status(201).json({ message: "Item created successfully", item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create inventory item" });
    }
};

// READ: Get all inventory items (Logged-in Users)
const getAllItems = async (req, res) => {
    try {
        // 1. Extract query parameters with default values
        // If the user doesn't provide them, default to page 1, 10 items per page
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // 2. Calculate how many items to skip
        // Example: If page = 2, limit = 10. Skip = (2 - 1) * 10 = 10 items skipped.
        const skip = (page - 1) * limit;

        // 3. Fetch the data using Prisma's take and skip
        const items = await prisma.inventoryItem.findMany({
            skip: skip,
            take: limit,
            include: {
                supplier: true // Keep our Day 10 optimization!
            }
        });

        // 4. (Best Practice) Count total items so the frontend knows how many pages exist
        const totalItems = await prisma.inventoryItem.count();
        const totalPages = Math.ceil(totalItems / limit);

        // 5. Send back a structured response
        res.status(200).json({
            data: items,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ error: "Failed to fetch items" });
    }
};

module.exports = {
    createItem,
    getAllItems
};