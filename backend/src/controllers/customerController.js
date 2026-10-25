/**
 * Customer Directory Controller.
 * 
 * Synchronizes customer contact details across all historical sale records.
 */

const UserLog = require('../models/UserLog');

/**
 * Update customer name and/or phone number across all associated sales.
 * POST /v1/customers/update
 */
async function updateCustomer(req, res, next) {
  try {
    const { oldName, oldNumber, newName, newNumber } = req.body;
    const email = req.userEmail;

    if (!email || email === 'anonymous') {
      return res.status(401).send('Unauthorized: Valid X-User-Email header required');
    }

    const updateFilter = {
      type: 'SALE',
      email: email,
      dataType: 'transaction',
    };

    if (oldNumber && oldNumber.trim() !== '') {
      updateFilter.customerNumber = oldNumber.trim();
    } else {
      updateFilter.$or = [
        { customerNumber: { $exists: false } },
        { customerNumber: '' },
        { customerNumber: null },
      ];
      // Case-insensitive exact name match (escaping special regex characters)
      const escapedName = (oldName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      updateFilter.customerName = { $regex: new RegExp(`^${escapedName}$`, 'i') };
    }

    await UserLog.updateMany(updateFilter, {
      $set: {
        customerName: (newName || '').trim(),
        customerNumber: (newNumber || '').trim(),
      },
    });

    return res.status(200).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateCustomer,
};
