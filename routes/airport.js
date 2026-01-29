const express = require('express');
const router = express.Router();
const airportModel = require('../models/airport');
const airportSchema = require('../schemas/airport');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Creazione Airport (solo per Admin)
router.post('/create', auth, isAdmin, async (req, res) => {
    const { error, value } = airportSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error: error.details[0].message });
    }

    try {
        const existing = await airportModel.findOne({ code: value.code });
        if (existing) {
            return res.status(400).json({ message: "Airport with this code already exists" });
        }

        const airport = new airportModel(value);
        await airport.save();
        
        return res.status(201).json({ message: "Airport created", data: airport });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// Mostra tutti gli aeroporti
router.get('/getall', async (req, res) => {
    try {
        const airports = await airportModel.find().sort({ city: 1 });
        return res.status(200).json({ data: airports });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching airports", error: err.message });
    }
});

// Cerca aeroporti per città, codice o nome
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Missing query" });

    try {
        const regex = new RegExp(q, 'i');
        const airports = await airportModel.find({
            $or: [
                { city: regex },
                { code: regex },
                { name: regex }
            ]
        });
        return res.status(200).json({ data: airports });
    } catch (err) {
        return res.status(500).json({ message: "Error searching airports", error: err.message });
    }
});

module.exports = router;
