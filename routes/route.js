const express = require('express');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const router = express.Router();
const mongoose = require('mongoose');
const routeSchema = require('../models/routes');
const createRouteSchema = require('../schemas/route');
const airportModel = require('../models/airport');

// Creazione di una nuova rotta, accessibile solo alle compagnie aeree
router.post("/create/", auth, is_airline, async (req, res) => {
    const { error, value} = createRouteSchema.validate(req.body);
    if (error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }
    const { flight_time, departure, destination, intermediary_stop } = value;

    // Validate that departure and destination are valid airports/cities
    const depAirport = await airportModel.findOne({ 
        $or: [{ city: departure }, { code: departure }, { name: departure }] 
    });
    const destAirport = await airportModel.findOne({ 
        $or: [{ city: destination }, { code: destination }, { name: destination }] 
    });

    
    const airportCount = await airportModel.countDocuments();
    if (airportCount > 0) {
        if (!depAirport) {
            return res.status(400).json({ message: "Bad Request", error: `Departure '${departure}' not found in supported airports` });
        }
        if (!destAirport) {
             return res.status(400).json({ message: "Bad Request", error: `Destination '${destination}' not found in supported airports` });
        }
    }

    try {
        const newRoute = new routeSchema({
            flight_time,
            departure: depAirport._id,
            destination: destAirport._id,
            owner: req.id
        });
        await newRoute.save();
        return res.status(201).json({
            message: "Route created successfully",
            route: newRoute
        });
    }catch(err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: "Error creating route: " + err.message
        });
    }
});

// Recupera tutte le rotte create dalla compagnia aerea autenticata
router.get("/my-routes", auth, is_airline, async (req, res) => {
    try {
        const routes = await routeSchema.find({ owner: req.id })
            .populate('departure')
            .populate('destination');
        return res.status(200).json({ data: routes });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching routes", error: err.message });
    }
});

module.exports = router;