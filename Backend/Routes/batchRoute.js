const express = require('express');
const router = express.Router();
const { getAllBatches, createBatch, updateBatch, deleteBatch } = require('../Controllers/batchController');
const { verifyToken, isAdmin } = require('../Middleware/auth');

router.get('/', getAllBatches);
router.post('/', verifyToken, isAdmin, createBatch);
router.put('/:id', verifyToken, isAdmin, updateBatch);
router.delete('/:id', verifyToken, isAdmin, deleteBatch);

module.exports = router;
