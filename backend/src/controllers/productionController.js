/**
 * Production Controller.
 * 
 * Manages loom manufacturing batches:
 * - Querying production batches
 * - Bulk synchronization / update
 * - Soft deletion of completed or canceled batches
 */

const UserLog = require('../models/UserLog');

/**
 * Fetch all loom production batch records for the authenticated tenant.
 * GET /v1/production
 */
async function getProduction(req, res, next) {
  try {
    const email = req.userEmail;
    const items = await UserLog.find({ dataType: 'production', email }, '-__v').lean();
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk upsert production batches.
 * POST /v1/production
 */
async function bulkUpsertProduction(req, res, next) {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Request body must be an array of production batches' });
    }

    const email = req.userEmail;
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { id: item.id, dataType: 'production', email },
        update: {
          $set: {
            ...item,
            email,
            dataType: 'production',
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
 * Soft-delete a production batch by ID.
 * DELETE /v1/production/item/:id
 */
async function deleteProductionItem(req, res, next) {
  try {
    const email = req.userEmail;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid production ID parameter' });
    }

    await UserLog.findOneAndUpdate(
      { id: itemId, dataType: 'production', email },
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

module.exports = {
  getProduction,
  bulkUpsertProduction,
  deleteProductionItem,
};
