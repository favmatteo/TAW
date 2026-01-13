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
const routeSchema = require('../models/routes'); // Added to check ownership
const ticketModel = require('../models/ticket'); // Added for statistics

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

    // Verify ownership of route and aircraft
    const routeObj = await routeSchema.findById(value.route);
    const aircraftObj = await aircraftModel.findById(value.aircraft);
    
    if (routeObj.owner.toString() !== req.id || aircraftObj.owner.toString() !== req.id) {
         return res.status(403).json({
             message: "Forbidden",
             error: "You can only create flights for your own routes and aircrafts"
         });
    }

    const { route, aircraft, economy_cost, business_cost, first_class_cost, extra_baggage_cost, departure_time } = value;

    try {
        const flight = new flightModel({
            route: route,
            aircraft: aircraft,
            owner: req.id,
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

const ObjectId = mongoose.Types.ObjectId;

router.get("/statistics", auth, is_airline, async (req, res) => {
    try {
        const airlineId = req.id;

        // 1. Total Revenue and Passengers per Flight (and for all flights)
        const flights = await flightModel.find({ owner: airlineId });
        const flightIds = flights.map(f => f._id);
        
        // Use aggregation to calculate revenue and passengers for tickets related to these flights
        const stats = await ticketModel.aggregate([
            { $match: { flight: { $in: flightIds } } },
            { 
              $group: { 
                _id: null, 
                totalRevenue: { $sum: "$price" },
                totalPassengers: { $sum: 1 }
              } 
            }
        ]);
        
        // 2. Most In-Demand Routes
        const routeStats = await ticketModel.aggregate([
             { $match: { flight: { $in: flightIds } } },
             { $lookup: { from: 'flights', localField: 'flight', foreignField: '_id', as: 'flight_info' } },
             { $unwind: '$flight_info' },
             { $group: { _id: '$flight_info.route', count: { $sum: 1 } } },
             { $sort: { count: -1 } },
             { $limit: 5 },
             { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route_info' } },
             { $unwind: '$route_info' }
        ]);

        return res.status(200).json({
            message: "Statistics",
            data: {
                totalRevenue: stats.length > 0 ? stats[0].totalRevenue : 0,
                totalPassengers: stats.length > 0 ? stats[0].totalPassengers : 0,
                popularRoutes: routeStats.map(r => ({
                     departure: r.route_info.departure,
                     destination: r.route_info.destination,
                     ticketsSold: r.count
                }))
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching statistics", error: error.message });
    }
});

router.get("/my-flights", auth, is_airline, async (req, res) => {
    try {
        const flights = await flightModel.find({ owner: req.id })
            .populate('route')
            .populate('aircraft');
        return res.status(200).json({ data: flights });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching flights", error: err.message });
    }
});

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