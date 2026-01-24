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

const isAdmin = require('../middleware/admin');
const ticketModel = require('../models/ticket');
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

// Admin: list all passengers
router.get('/all', auth, isAdmin, async (req, res) => {
    try {
        const passengers = await passengerModel.find().select('-password').sort({ created_at: -1 });
        return res.status(200).json({ data: passengers });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching passengers', error: error.message });
    }
});

// Admin: delete passenger and their tickets
router.delete('/:id', auth, isAdmin, async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Bad Request', error: 'Missing passenger id' });

    try {
        const passenger = await passengerModel.findById(id);
        if (!passenger) return res.status(404).json({ message: 'Passenger not found' });

        // remove tickets belonging to this passenger
        await ticketModel.deleteMany({ passenger: passenger._id });

        await passengerModel.findByIdAndDelete(passenger._id);

        return res.status(200).json({ message: 'Passenger and related tickets deleted' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting passenger', error: error.message });
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
            email: passenger.email,
            name: passenger.name,
            role: 'passenger'
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
    const p = await passengerModel.findById(req.id);
    if (!p) return res.status(404).json({ message: 'Passenger not found' });
    const { _id, name, email, created_at, money } = p;
    return res.status(200).json({
        message: "Passenger profile",
        data: {
            id: _id,
            name: name,
            email: email,
            created_at: created_at,
            money: money || 0
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
