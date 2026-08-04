const prisma = require('../config/prisma');

// CREATE: Add a new supplier
const createSupplier = async (req, res, next) => {
    try {
        const { name, gst_number, contact_info } = req.body;

        const supplier = await prisma.supplier.create({
            data: { name, gst_number, contact_info }
        });

        res.status(201).json({ message: "Supplier created", supplier });
    } catch (error) {
        next(error);
    }
};

// READ: Get all suppliers
const getAllSuppliers = async (req, res, next) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.status(200).json(suppliers);
    } catch (error) {
        next(error);
    }
};

// UPDATE: Modify a supplier
const updateSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, gst_number, contact_info } = req.body;

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: { name, gst_number, contact_info }
        });

        res.status(200).json({ message: "Supplier updated", supplier: updatedSupplier });
    } catch (error) {
        next(error);
    }
};

// DELETE: Remove a supplier
const deleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.supplier.delete({
            where: { id }
        });

        res.status(200).json({ message: "Supplier deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier
};