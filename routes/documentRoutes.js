const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const Document = require('../models/Document');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);

        const pages = [];
        const textByPage = data.text.split('\f');
        textByPage.forEach((pageText, index) => {
            pages.push({
                text: pageText.trim(),
                pageNumber: index + 1
            });
        });

        const document = new Document({
            filename: req.file.originalname,
            path: req.file.path,
            pages,
            userId: req.body.userId
        });

        await document.save();

        res.status(201).json({
            message: 'PDF uploaded and processed successfully',
            documentId: document._id,
            filename: document.filename,
            pages: document.pages.length
        });
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

module.exports = router;