const express = require('express');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const router = express.Router();
const mongoose = require('mongoose');
const routeSchema = require('../models/routes');
const createRouteSchema = require('../schemas/route');
const airportModel = require('../models/airport');

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

    // Validazione opzionale: se non esistono aeroporti nel DB, potremmo permettere inserimento libero?
    // "Fai i dovuti cambiamenti": probabilmente si intende restrittivo.
    // Tuttavia, se il DB è vuoto, nessuno può creare rotte.
    // Assumiamo che se ci sono aeroporti, deve matchare. Se no, fallback?
    // Meglio: se abbiamo introdotto il model, usiamolo. 
    // Se l'utente non ha popolato la tabella aeroporti, non può creare rotte. Ha senso.
    
    // Per sicurezza check count
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