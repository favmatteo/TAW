const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const loginSchema = require('../schemas/login');
const signupSchema = require('../schemas/signup');
const is_passenger = require('../middleware/passenger');
const passenger = require('../models/passenger');

const router = express.Router();

router.post('/create', async (req, res) => {
    const { error, value } = signupSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    const { name, email, password } = value;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const exists = await passengerModel.findOne({ email });
        console.log(exists)
        if (exists) {
            return res.status(400).json({
                message: "Email already in use"
            })
        }
        const newPassenger = new passengerModel({
            name,
            email,
            password: hashedPassword
        });
        await newPassenger.save();
        return res.status(201).json({
            message: "Passenger created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error creating passenger",
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: "Bad Request",
            error: error.details[0].message,
        });
    }


    const { email, password } = value;

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

router.post("/add/money/", auth, is_passenger, async (req, res) => {
    if(!req.body || !req.body.amount || req.body.amount <= 0) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Invalid amount"
        });
    }
    try {
        await passengerModel.findByIdAndUpdate(
            req.id,
            { $inc: { money: req.body.amount } },
        );
        return res.status(200).json({
            message: "Money added successfully",
            data: {
                amount: req.body.amount
            }
        });
    }catch(err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
})


module.exports = router;
