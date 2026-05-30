const prisma = require('../config/prisma');

// CREATE: Add a new supplier
const createSupplier = async (req, res) => {
    try {
        const { name, gst_number, contact_info } = req.body;
        
        // Basic validation
        if (!name || !gst_number) {
            return res.status(400).json({ error: "Name and GST Number are required" });
        }

        const supplier = await prisma.supplier.create({
            data: { name, gst_number, contact_info }
        });

        res.status(201).json({ message: "Supplier created", supplier });
    } catch (error) {
        // Handle unique constraint failure (e.g., duplicate GST)
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Supplier with this GST already exists" });
        }
        res.status(500).json({ error: "Something went wrong" });
    }
};

// READ: Get all suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
};

// UPDATE: Modify a supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, gst_number, contact_info } = req.body;

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: { name, gst_number, contact_info }
        });

        res.status(200).json({ message: "Supplier updated", supplier: updatedSupplier });
    } catch (error) {
        res.status(500).json({ error: "Failed to update supplier" });
    }
};

// DELETE: Remove a supplier
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.supplier.delete({
            where: { id }
        });

        res.status(200).json({ message: "Supplier deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete supplier" });
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier
};