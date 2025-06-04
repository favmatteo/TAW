const express = require('express');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const router = express.Router();
const mongoose = require('mongoose');
const routeSchema = require('../models/routes');
const createRouteSchema = require('../schemas/route');
router.post("/create/", auth, is_airline, async (req, res) => {
    console.log(req.body);
    const { error, value} = createRouteSchema.validate(req.body);
    if (error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }
    const { flight_time, departure, destination, intermediary_stop } = value;
    try {
        const newRoute = new routeSchema({
            flight_time,
            departure,
            destination,
            intermediary_stop
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

module.exports = router;