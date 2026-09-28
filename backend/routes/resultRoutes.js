const express = require('express');
const router = express.Router();
const {
  getAllResults,
  getProjectResult
} = require('../controllers/resultController');

// Result routes (Public)
router.get('/', getAllResults);
router.get('/:projectId', getProjectResult);

module.exports = router;
