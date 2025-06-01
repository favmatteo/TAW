const express = require('express');
const airlineModel = require('../models/airlines');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const loginSchema = require('../schemas/login');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    const { email, password } = value;

    try {
        const airline = await airlineModel.findOne({ email });
        if (!airline) return res.status(404).json({
            "message": "Airline not found"
        });

        const correctPassword = await bcrypt.compare(password, airline.password);
        if (!correctPassword) {
            return res.status(401).json({
                "message": "Unauthorized: Incorrect password"
            });
        }

        const token = jwt.sign({
            id: airline._id,
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
    const { _id, name, email, created_at } = await airlineModel.findById(req.id);
    return res.status(200).json({
        message: "Airline profile",
        data: {
            id: _id,
            name: name,
            email: email,
            created_at, created_at
        }
    });
})

module.exports = router;