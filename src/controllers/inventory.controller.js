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
        // We use 'include' to fetch the supplier data right alongside the item!
        const items = await prisma.inventoryItem.findMany({
            include: {
                supplier: true 
            }
        });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch items" });
    }
};

module.exports = {
    createItem,
    getAllItems
};