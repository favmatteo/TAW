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

    if(!await route_exists(value.route)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Route does not exist"
        });
    }

    if(!await aircraft_exists(value.aircraft)) {
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

router.get("/getall/", async (req, res) => {
    try {
        const flights = await flightModel.find()
            .populate('route')
            .populate('aircraft');
        
        if (flights.length === 0) {
            return res.status(404).json({
                message: "No flights found"
            });
        }

        return res.status(200).json({
            message: "All flights",
            data: flights
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching flights",
            error: error.message
        });
    }
})

router.get("/get/:id", async (req, res) => {

    const id = req.params.id;
    if (!id || !mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Missing flight ID"
        });
    }

    try {
        const flight = await flightModel.findById(id)
            .populate('route')
            .populate('aircraft');
        if (!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }
        const availableSeats = await seatModel.find({ aircraft: flight.aircraft});

        return res.status(200).json({
            message: "Flight details",
            data: {
                flight,
                availableSeats
            }
        });

    }catch (error) {
        return res.status(500).json({
            message: "Error fetching flight details",
            error: error.message
        });
    }
})

router.get("/seats/:flight_id", async (req, res) => {
    const flight_id = req.params.flight_id;
    const { available, type } = req.query;

    if(available && (available.toLowerCase() !== 'true' && available.toLowerCase() !== 'false')) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Invalid value for 'available' query parameter. boolean expected."
        });
    }

    if(type && !['economy', 'business', 'first_class'].includes(type.toLowerCase())) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Invalid value for 'type' query parameter. Valid values are 'economy', 'business', 'first_class'."
        });
    }

    if(!flight_id || !mongoose.isValidObjectId(flight_id)) {
        return res.status(400).json({
            message: "Bad Request",
            error: "Missing flight ID"
        });
    }
    try {
        const flight = await flightModel.findById(flight_id).populate('aircraft');
        if(!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }

        let seats;
        const filter = { aircraft: flight.aircraft._id };
        
        if (available) { filter.is_available = available.toLowerCase() === 'true'; }
        if (type) { filter.type = type.toLowerCase(); }
        seats = await seatModel.find(filter);

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

});

    

module.exports = router;