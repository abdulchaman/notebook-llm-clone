const express = require('express');
const { processQuery } = require('../utils/aiProcessor');
const router = express.Router();

router.post('/query', async (req, res) => {
    try {
        const { documentId, question } = req.body;
        const response = await processQuery(question, documentId);
        res.json(response);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

module.exports = router;