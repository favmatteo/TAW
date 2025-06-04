const express = require('express');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const flightModel = require('../models/flight');
const createFlightSchema = require('../schemas/flight');
const seatModel = require('../models/seat');
const aircraftModel = require('../models/aircraft');
const router = express.Router();
const mongoose = require('mongoose');

 
const {route_exists, aircraft_exists} = require('../routes/utils');


router.post("/create/", auth, is_airline, async (req, res) => {

    const { error, value } = createFlightSchema.validate(req.body);
    if (error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    if(!route_exists(value.route)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Route does not exist"
        });
    }

    if(!aircraft_exists(value.aircraft)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Aircraft does not exist"
        });
    }

    const { route, aircraft, economy_cost, business_cost, first_class_cost, extra_baggage_cost, departure_time } = value;

    try {
        

        const flight = new flightModel({
            route: route,
            aircraft: aircraft,
            economy_cost,
            business_cost,
            first_class_cost,
            extra_baggage_cost,
            departure_time
        });
        
        await flight.save();

        await aircraftModel.findByIdAndUpdate(value.aircraft, {
            $push: { flights: flight._id }
        });

        return res.status(201).json({
            message: "Flight created successfully",
            data: flight
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
})

router.get("/get/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Missing flight ID"
        });
    }

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Invalid flight ID format"
        });
    }

    try {
        const flight = await flightModel.findById(id)
            .populate('departure', 'name')
            .populate('destination', 'name')
            .populate('intermediary_stop', 'name');

        if (!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }


        const seats = await seatModel.find({ flight: flight._id }, projection = { flight: 0, __v: 0 });

        return res.status(200).json({
            message: "Flight details",
            data: {
                flight,
                seats
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching flight",
            error: error.message
        });
    }

})
/*
router.get("/seats/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Missing flight ID"
        });
    }

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Invalid flight ID format"
        });
    }
    try {
        const flight = await flightSchema.findById(id);
        if (!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }

        const seats = await seatSchema.find({ flight: flight._id, 'is_available': true });
        return res.status(200).json({
            message: "Available seats",
            data: seats
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching seats",
            error: error.message
        });
    }


})*/

module.exports = router;