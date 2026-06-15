-- CreateTable
CREATE TABLE "Purchase_Order" (
    "id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "itc_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "Purchase_Order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Purchase_Order" ADD CONSTRAINT "Purchase_Order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_Order" ADD CONSTRAINT "Purchase_Order_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
