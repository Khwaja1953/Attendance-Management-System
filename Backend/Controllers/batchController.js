const Batch = require('../Models/Batch');

const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batches.', error: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const { name, course, startTime, endTime, days, isActive } = req.body;

    if (!name || !course || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'name, course, startTime, and endTime are required.' });
    }

    const batch = await Batch.create({ name, course, startTime, endTime, days, isActive });

    return res.status(201).json({
      success: true,
      message: 'Batch created successfully.',
      data: batch
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Batch with this name already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create batch.', error: error.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Batch updated successfully.',
      data: batch
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Batch with this name already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update batch.', error: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByIdAndDelete(id);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Batch deleted successfully.',
      data: batch
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete batch.', error: error.message });
  }
};

module.exports = { getAllBatches, createBatch, updateBatch, deleteBatch };
