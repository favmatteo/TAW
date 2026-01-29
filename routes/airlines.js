const express = require('express');
const airlineModel = require('../models/airlines');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const loginSchema = require('../schemas/login');
const is_airline = require('../middleware/airline');
const isAdmin = require('../middleware/admin');
const ticketModel = require('../models/ticket');

const router = express.Router();

// Invito ad una nuova airline (solo Admin)
router.post('/invite', auth, isAdmin, async (req, res) => {
    const { name, email, password } = req.body;
    
    if(!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }

    try {
        const existing = await airlineModel.findOne({ email });
        if(existing) {
             return res.status(400).json({ message: "Airline already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAirline = new airlineModel({
            name,
            email,
            password: hashedPassword,
            must_change_password: true
        });

        await newAirline.save();
        return res.status(201).json({ message: "Airline invited successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Error inviting airline", error: error.message });
    }
});

// Serve per settare la password iniziale ad una airline invitata
router.put('/setup', auth, is_airline, async (req, res) => {
    const { password, name } = req.body;
    
    // We expect at least password to be changed or confirmed.
    // The user prompts says "must set its password and any relevant information".
    
    try {
        const airline = await airlineModel.findById(req.id);
        if(!airline) return res.status(404).json({ message: "Airline not found" });

        if(password) {
             airline.password = await bcrypt.hash(password, 10);
        }
        if(name) {
            airline.name = name;
        }
        
        airline.must_change_password = false;
        await airline.save();

        return res.status(200).json({ message: "Airline setup complete" });

    } catch (error) {
         return res.status(500).json({ message: "Error updating airline", error: error.message });
    }
});

// Login airline
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
            email: airline.email,
            role: 'airline'
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).json({
            message: "Login successful",
            token: token,
            must_change_password: airline.must_change_password
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error during login",
            error: error.message
        });
    }

})

// Ottieni le informazioni dell'airline
router.get('/profile', auth, is_airline, async (req, res) => {
    const { _id, name, email, created_at, must_change_password } = await airlineModel.findById(req.id);
    return res.status(200).json({
        message: "Airline profile",
        data: {
            id: _id,
            name: name,
            email: email,
            created_at, created_at,
            must_change_password
        }
    });
})

// Statistiche di tutte le airlines (Admin)
router.get('/stats/all', auth, isAdmin, async (req, res) => {
    try {
        const airlines = await airlineModel.find();
        const results = [];

        for (const a of airlines) {
            // 
            const agg = await ticketModel.aggregate([
                { $lookup: { from: 'flights', localField: 'flight', foreignField: '_id', as: 'flight_info' } },
                { $unwind: '$flight_info' },
                { $match: { 'flight_info.owner': a._id } },
                { $group: { _id: null, totalRevenue: { $sum: '$price' }, totalPassengers: { $sum: 1 } } }
            ]);

            // le route più popolari per questa airline
            const topRoutes = await ticketModel.aggregate([
                { $lookup: { from: 'flights', localField: 'flight', foreignField: '_id', as: 'flight_info' } },
                { $unwind: '$flight_info' },
                { $match: { 'flight_info.owner': a._id } },
                { $group: { _id: '$flight_info.route', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route_info' } },
                { $unwind: '$route_info' },
                { $lookup: { from: 'airports', localField: 'route_info.departure', foreignField: '_id', as: 'dep_airport' } },
                { $unwind: '$dep_airport' },
                { $lookup: { from: 'airports', localField: 'route_info.destination', foreignField: '_id', as: 'des_airport' } },
                { $unwind: '$des_airport' },
                { $project: { departure: { $concat: ['$dep_airport.city', ' (', '$dep_airport.code', ')'] }, destination: { $concat: ['$des_airport.city', ' (', '$des_airport.code', ')'] }, ticketsSold: '$count' } }
            ]);

            totalRevenue = 0;
            if(arr.length > 0) {
                totalRevenue = agg[0].totalRevenue;
            }

            totalPassengers = 0;
            if(agg.length > 0) {
                totalPassengers = agg[0].totalPassengers;
            }

            results.push({
                airlineId: a._id,
                airlineName: a.name,
                totalRevenue: totalRevenue,
                totalPassengers: totalPassengers,
                popularRoutes: topRoutes
            });
        }

        return res.status(200).json({ data: results });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching airlines stats', error: error.message });
    }
});

module.exports = router;