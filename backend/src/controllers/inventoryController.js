/**
 * Inventory Controller.
 * 
 * Manages saree inventory catalog items:
 * - Querying active and archived inventory records
 * - Bulk synchronization / reset
 * - Single item create/update (upsert)
 * - Soft deletion of catalog items
 */

const UserLog = require('../models/UserLog');

/**
 * Fetch all inventory records for the authenticated tenant.
 * GET /v1/inventory
 */
async function getInventory(req, res, next) {
  try {
    const email = req.userEmail;
    const items = await UserLog.find({ dataType: 'inventory', email }, '-__v').lean();
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk upsert inventory items (used during data import/sync).
 * POST /v1/inventory
 */
async function bulkUpsertInventory(req, res, next) {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Request body must be an array of inventory items' });
    }

    const email = req.userEmail;
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { id: item.id, dataType: 'inventory', email },
        update: {
          $set: {
            ...item,
            email,
            dataType: 'inventory',
            imageUrl: item.imageUrl || null,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await UserLog.bulkWrite(bulkOps);
    }

    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Upsert a single inventory catalog item.
 * POST /v1/inventory/item
 */
async function saveInventoryItem(req, res, next) {
  try {
    const item = req.body;
    if (!item || typeof item.id === 'undefined') {
      return res.status(400).json({ error: 'Item with numeric id is required' });
    }

    const email = req.userEmail;
    await UserLog.findOneAndUpdate(
      { id: item.id, dataType: 'inventory', email },
      {
        ...item,
        email,
        dataType: 'inventory',
        imageUrl: item.imageUrl || null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Soft-delete an inventory item by ID.
 * DELETE /v1/inventory/item/:id
 */
async function deleteInventoryItem(req, res, next) {
  try {
    const email = req.userEmail;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID parameter' });
    }

    await UserLog.findOneAndUpdate(
      { id: itemId, dataType: 'inventory', email },
      {
        $set: {
          isDeleted: true,
          lastModified: Date.now(),
        },
      }
    );

    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Atomically process a sale:
 * - Checks that pieceCount >= quantity requested with MongoDB atomic condition
 * - Decrements stock using $inc: { pieceCount: -quantity }
 * - Automatically creates the SELL_OUT transaction record in the same request
 * - Prevents race conditions and double-selling across multiple devices
 * POST /v1/inventory/sell
 */
async function sellInventoryItemAtomic(req, res, next) {
  try {
    const { itemId, quantity, unitPrice, customerName, customerNumber, notes } = req.body;
    const email = req.userEmail;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid numeric itemId and positive quantity are required' });
    }

    const qtyNum = parseInt(quantity, 10);
    const parsedItemId = parseInt(itemId, 10);

    // 1. Atomically check and decrement stock with conditional query
    const updatedInventoryItem = await UserLog.findOneAndUpdate(
      {
        id: parsedItemId,
        dataType: 'inventory',
        email,
        isDeleted: { $ne: true },
        pieceCount: { $gte: qtyNum }, // CONCURRENCY GUARD: Must have at least qtyNum pieces
      },
      {
        $inc: { pieceCount: -qtyNum },
        $set: { lastModified: Date.now() },
      },
      { new: true }
    );

    // 2. If null, it means either item doesn't exist OR another device already sold the stock!
    if (!updatedInventoryItem) {
      const currentItem = await UserLog.findOne({
        id: parsedItemId,
        dataType: 'inventory',
        email,
      });

      if (!currentItem || currentItem.isDeleted) {
        return res.status(404).json({
          error: 'ITEM_NOT_FOUND',
          message: 'The selected saree model no longer exists or was removed from inventory.',
        });
      }

      return res.status(409).json({
        error: 'INSUFFICIENT_STOCK',
        message: `Insufficient stock! Another device just sold this item. Available stock is now ${currentItem.pieceCount || 0} pcs.`,
        availableStock: currentItem.pieceCount || 0,
        modelName: currentItem.modelName,
      });
    }

    // 3. Atomically create SELL_OUT transaction record
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const priceNum = parseFloat(unitPrice) || updatedInventoryItem.unitPrice || 0;
    const totalAmount = qtyNum * priceNum;

    const txRecord = await UserLog.create({
      id: now,
      dataType: 'transaction',
      email,
      type: 'SELL_OUT',
      modelName: updatedInventoryItem.modelName,
      quantity: qtyNum,
      unitPrice: priceNum,
      totalAmount,
      timestamp: now,
      dateString: today,
      customerName: customerName ? customerName.trim() : undefined,
      customerNumber: customerNumber ? customerNumber.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      isDeleted: false,
      lastModified: now,
    });

    return res.status(200).json({
      status: 'ok',
      message: 'Sale completed successfully.',
      remainingStock: updatedInventoryItem.pieceCount,
      updatedItem: updatedInventoryItem,
      transaction: txRecord,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInventory,
  bulkUpsertInventory,
  saveInventoryItem,
  deleteInventoryItem,
  sellInventoryItemAtomic,
};
