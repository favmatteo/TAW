const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth_passenger');

const router = express.Router();

router.post('/create', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            "message": "Bad Request: No data provided"
        });
    }

    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json({
            "message": "Bad Request: Missing required fields"
        });
    }

    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newPassenger = new passengerModel({
            name,
            email,
            password: hashedPassword
        });
        await newPassenger.save();
        res.status(201).json({
            message: "Passenger created successfully"
        })
    } catch (error) {
        res.status(500).json({
            message: "Error creating passenger",
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            "message": "Bad Request: No data provided"
        });
    }

    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            "message": "Bad Request: Missing required fields"
        });
    }

    const { email, password } = req.body;

    try {
        const passenger = await passengerModel.findOne({ email });
        if (!passenger) return res.status(404).json({
            "message": "Passenger not found"
        });

        const correctPassword = await bcrypt.compare(password, passenger.password);
        if (!correctPassword) {
            return res.status(401).json({
                "message": "Unauthorized: Incorrect password"
            });
        }

        const token = jwt.sign({
            id: passenger._id,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error during login",
            error: error.message
        });
    }

})

router.get('/profile', auth, async (req, res) => {
    const { _id, name, email, created_at } = await passengerModel.findById(req.id);
    return res.status(200).json({
        message: "Passenger profile",
        data: {
            id: _id,
            name: name,
            email: email,
            created_at, created_at
        }
    });
})



module.exports = router;
