/**
 * Transaction Controller.
 * 
 * Manages financial ledger and cashflow entries:
 * - Querying transaction logs (filtered by tenant)
 * - Single transaction recording or bulk synchronization
 */

const UserLog = require('../models/UserLog');

/**
 * Fetch financial transaction records for the authenticated tenant.
 * GET /v1/transactions
 */
async function getTransactions(req, res, next) {
  try {
    const email = req.userEmail;
    const filter = { dataType: 'transaction' };

    // Apply tenant filter if present and non-anonymous
    if (email && email !== 'anonymous') {
      filter.email = email;
    }

    const logs = await UserLog.find(filter, '-__v').lean();
    return res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

/**
 * Record a single financial transaction or bulk upsert transactions.
 * POST /v1/transactions
 */
async function saveTransactions(req, res, next) {
  try {
    const payload = req.body;
    const email = req.userEmail;

    if (Array.isArray(payload)) {
      const bulkOps = payload.map((item) => ({
        updateOne: {
          filter: { id: item.id, email: email, dataType: 'transaction' },
          update: {
            $set: {
              ...item,
              email,
              dataType: 'transaction',
              imageUrl: item.imageUrl || null,
            },
          },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await UserLog.bulkWrite(bulkOps);
      }
    } else {
      await UserLog.findOneAndUpdate(
        { id: payload.id, email: email, dataType: 'transaction' },
        {
          $set: {
            ...payload,
            email,
            dataType: 'transaction',
            imageUrl: payload.imageUrl || null,
          },
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  saveTransactions,
};
