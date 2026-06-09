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
        const search = req.query.search || '';     // New: Text search
        const category = req.query.category || ''; // New: Exact match filter

        //  Calculate how many items to skip
        // Example: If page = 2, limit = 10. Skip = (2 - 1) * 10 = 10 items skipped.
        const skip = (page - 1) * limit;

        //  Build the dynamic filter conditions
        const filterConditions = {};

        if (search) {
            // Prisma's version of SQL LIKE '%search%'
            // 'insensitive' means "Liner" and "liner" will both match
            filterConditions.name = {
                contains: search,
                mode: 'insensitive' 
            };
        }

        if (category) {
            // Exact match for category
            filterConditions.category = category;
        }

        // 3. Fetch the data using Prisma's take and skip
        const items = await prisma.inventoryItem.findMany({
            where: filterConditions,
            skip: skip,
            take: limit,
            include: {
                supplier: true 
            }
        });

        // 4. Get the total count of items that match the filter (for pagination meta)
        const totalItems = await prisma.inventoryItem.count({
            where: filterConditions
        });
        const totalPages = Math.ceil(totalItems / limit);

        // 5. Send back a structured response
        res.status(200).json({
            data: items,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                filtersApplied: { search, category }
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