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


// Endpoint per recuperare le statistiche dei voli per una compagnia aerea
/*
Funziona in questo modo:
Riceve la richiesta autenticata di una compagnia aerea.
Recupera tutti i voli associati alla compagnia aerea.
Per ogni volo calcola:
   - Il totale delle entrate generate dalla vendita dei biglietti.
    - Il numero totale di passeggeri.
    - Le rotte più richieste in base al numero di biglietti venduti.
    - Le entrate e i passeggeri per ogni volo.
    - Le entrate e i passeggeri totali per ogni rotta.
Restituisce le statistiche in formato JSON.
*/
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
        
        // 2. Rotte più popolari
        const routeStats = await ticketModel.aggregate([
             { $match: { flight: { $in: flightIds } } },
             { $lookup: { from: 'flights', localField: 'flight', foreignField: '_id', as: 'flight_info' } },
             { $unwind: '$flight_info' },
             { $group: { _id: '$flight_info.route', count: { $sum: 1 } } },
             { $sort: { count: -1 } },
             { $limit: 3 },
             { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route_info' } },
             { $unwind: '$route_info' },
             { $lookup: { from: 'airports', localField: 'route_info.departure', foreignField: '_id', as: 'dep_airport' } },
             { $unwind: '$dep_airport' },
             { $lookup: { from: 'airports', localField: 'route_info.destination', foreignField: '_id', as: 'des_airport' } },
             { $unwind: '$des_airport' }
        ]);

        // 3. Totale soldi e passeggeri per volo
        const perFlight = await ticketModel.aggregate([
            { $match: { flight: { $in: flightIds } } },
            { $group: { _id: '$flight', totalRevenue: { $sum: '$price' }, totalPassengers: { $sum: 1 } } },
            { $lookup: { from: 'flights', localField: '_id', foreignField: '_id', as: 'flight_info' } },
            { $unwind: '$flight_info' },
            { $lookup: { from: 'routes', localField: 'flight_info.route', foreignField: '_id', as: 'route_info' } },
            { $unwind: '$route_info' },
            { $lookup: { from: 'airports', localField: 'route_info.departure', foreignField: '_id', as: 'dep_airport' } },
            { $unwind: '$dep_airport' },
            { $lookup: { from: 'airports', localField: 'route_info.destination', foreignField: '_id', as: 'des_airport' } },
            { $unwind: '$des_airport' },
            { $project: {
                flightId: '$_id',
                totalRevenue: 1,
                totalPassengers: 1,
                departure: { $concat: ['$dep_airport.city', ' (', '$dep_airport.code', ')'] },
                destination: { $concat: ['$des_airport.city', ' (', '$des_airport.code', ')'] },
                departure_time: '$flight_info.departure_time'
            } }
        ]);

        // 4. Totale soldi e passeggeri per rotta
        const perRoute = await ticketModel.aggregate([
            { $match: { flight: { $in: flightIds } } },
            { $lookup: { from: 'flights', localField: 'flight', foreignField: '_id', as: 'flight_info' } },
            { $unwind: '$flight_info' },
            { $group: { _id: '$flight_info.route', totalRevenue: { $sum: '$price' }, totalPassengers: { $sum: 1 } } },
            { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route_info' } },
            { $unwind: '$route_info' },
            { $lookup: { from: 'airports', localField: 'route_info.departure', foreignField: '_id', as: 'dep_airport' } },
            { $unwind: '$dep_airport' },
            { $lookup: { from: 'airports', localField: 'route_info.destination', foreignField: '_id', as: 'des_airport' } },
            { $unwind: '$des_airport' },
            { $project: {
                routeId: '$_id',
                departure: { $concat: ['$dep_airport.city', ' (', '$dep_airport.code', ')'] },
                destination: { $concat: ['$des_airport.city', ' (', '$des_airport.code', ')'] },
                totalRevenue: 1,
                totalPassengers: 1
            } }
        ]);

        return res.status(200).json({
            message: "Statistics",
            data: {
                totalRevenue: stats.length > 0 ? stats[0].totalRevenue : 0,
                totalPassengers: stats.length > 0 ? stats[0].totalPassengers : 0,
                popularRoutes: routeStats.map(r => ({
                     departure: `${r.dep_airport.city} (${r.dep_airport.code})`,
                     destination: `${r.des_airport.city} (${r.des_airport.code})`,
                     ticketsSold: r.count
                })),
                perFlight,
                perRoute
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching statistics", error: error.message });
    }
});

// Endpoint per recuperare tutti i voli di una compagnia aerea autenticata
router.get("/my-flights", auth, is_airline, async (req, res) => {
    try {
        const flights = await flightModel.find({ owner: req.id })
            .populate({
                path: 'route',
                populate: { path: 'departure destination' }
            })
            .populate('aircraft');
        return res.status(200).json({ data: flights });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching flights", error: err.message });
    }
});

/*
La funzione isMatch verifica se un aeroporto corrisponde a un termine di ricerca confrontando città, nome e codice.
Restituisce true se c'è una corrispondenza, altrimenti false.
*/
function isMatchFunction(airport, search) {
    if (!airport) 
        return false;
    let match = false;
    if (airport.city && airport.city.toLowerCase() === search) match = true;
    if (airport.name && airport.name.toLowerCase() === search) match = true;
    if (airport.code && airport.code.toLowerCase() === search) match = true;
    return match;
}

// Endpoint per recuperare tutti i voli con funzionalità di ricerca
router.get("/getall/", async (req, res) => {
    try {
        const flights = await flightModel.find()
            .populate({
                path: 'route',
                populate: { path: 'departure destination' }
            })
            .populate('aircraft')
            .populate('owner');
        
        const { from, to } = req.query;

        // Helper match function
        const isMatch = isMatchFunction;

        // Search Logic: support from+to, from only (from X to anywhere), to only (from anywhere to X)
        if (from || to) {
            const searchFrom = from ? from.toLowerCase() : null;
            const searchTo = to ? to.toLowerCase() : null;
            const results = [];

            // Direct flights matching available criteria
            const direct = flights.filter(f => {
                const matchFrom = searchFrom ? isMatch(f.route.departure, searchFrom) : true;
                const matchTo = searchTo ? isMatch(f.route.destination, searchTo) : true;
                return matchFrom && matchTo;
            });
            

            direct.forEach(f => {
                results.push({
                    _id: f._id,
                    type: 'direct',
                    flights: [f],
                    route: {
                        departure: f.route.departure.city,
                        destination: f.route.destination.city,
                        flight_time: f.route.flight_time
                    },
                    departure_time: f.departure_time,
                    arrival_time: new Date(f.departure_time.getTime() + f.route.flight_time * 60000),
                    economy_cost: f.economy_cost,
                    business_cost: f.business_cost,
                    first_class_cost: f.first_class_cost
                });
            });

            // 1-stop flights: consider legs where leg1 dep matches searchFrom (if provided) and leg2 dest matches searchTo (if provided)
            const potentialLeg1s = searchFrom ? flights.filter(f => isMatch(f.route.departure, searchFrom)) : flights.slice();

            for (const leg1 of potentialLeg1s) {
                const leg1Arrival = new Date(leg1.departure_time.getTime() + leg1.route.flight_time * 60000);
                const stopAirportId = leg1.route.destination._id.toString();

                // connecting flights depart from stopAirportId
                const connectingFlights = flights.filter(f => f.route.departure._id.toString() === stopAirportId);

                for (const leg2 of connectingFlights) {
                    // If searchTo is provided, require leg2 destination match
                    if (searchTo && !isMatch(leg2.route.destination, searchTo)) continue;

                    // Check transfer time >= 2 hours
                    const diffMs = leg2.departure_time - leg1Arrival;
                    const diffHours = diffMs / (1000 * 60 * 60);
                    if (diffHours < 2) continue;

                    results.push({
                        type: 'stopover',
                        flights: [leg1, leg2],
                        route: {
                            departure: leg1.route.departure.city,
                            destination: leg2.route.destination.city,
                            stop: leg1.route.destination.city,
                            flight_time: leg1.route.flight_time + leg2.route.flight_time + (diffMs / 60000)
                        },
                        departure_time: leg1.departure_time,
                        arrival_time: new Date(leg2.departure_time.getTime() + leg2.route.flight_time * 60000),
                        economy_cost: leg1.economy_cost + leg2.economy_cost,
                        business_cost: leg1.business_cost + leg2.business_cost,
                        first_class_cost: leg1.first_class_cost + leg2.first_class_cost
                    });
                }
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "No flights found" });
            }

            return res.status(200).json({ message: "Search results", data: results });
        }

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