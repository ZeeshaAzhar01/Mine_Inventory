// Import your Prisma instance
const prisma = require('../config/prisma');

// 1. Fetch Low Stock Items (Raw SQL)
const fetchLowStockItems = async () => {
    // Notice the double quotes around the table name from our Day 13 debugging!
    const items = await prisma.$queryRaw`
        SELECT * FROM "InventoryItem" WHERE stock_qty <= min_stock_threshold
    `;
    return items;
};

// 2. Fetch All Items (With Pagination, Filtering, and JOINs)
const fetchAllItems = async (search, category, skip, take) => {
    // Build the dynamic filter object
    const where = {};
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // Ask Prisma for the items AND the total count
    const [items, totalItems] = await Promise.all([
        prisma.inventoryItem.findMany({
            where,
            skip,
            take,
            include: { supplier: true } // The N+1 Fix
        }),
        prisma.inventory_Item.count({ where })
    ]);

    return { items, totalItems };
};

// 3. Create a New Item
const createNewItem = async (itemData) => {
    const newItem = await prisma.inventory_Item.create({
        data: itemData
    });
    return newItem;
};

module.exports = {
    fetchLowStockItems,
    fetchAllItems,
    createNewItem
};