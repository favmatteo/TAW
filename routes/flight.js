const express = require('express');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const flightSchema = require('../models/flight');
const createFlightSchema = require('../schemas/flight');
const seatSchema = require('../models/seat');
const router = express.Router();
const citySchema = require('../models/city');
const mongoose = require('mongoose');

router.post("/create/", auth, is_airline, async (req, res) => {

    const { error, value } = createFlightSchema.validate(req.body);
    if (error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    try {

        const getOrCreateCity = async (cityName) => {
            let city = await citySchema.findOne({ name: cityName })
            if (!city) {
                city = new citySchema({ name: cityName });
                await city.save();
            }
            return city._id;
        }

        const departureId = await getOrCreateCity(value.departure);
        const destinationId = await getOrCreateCity(value.destination);
        const intermediaryStopId = value.intermediary_stop ? await getOrCreateCity(value.intermediary_stop) : null;

        const newFlight = new flightSchema({
            economy_cost: value.economy_cost,
            business_cost: value.business_cost,
            first_class_cost: value.first_class_cost,

            departure_time: value.departure_time,
            flight_time: value.flight_time,

            departure: departureId,
            destination: destinationId,
            intermediary_stop: intermediaryStopId
        });

        await newFlight.save();

        let seat_number = 0;
        const classes = [
            {
                type: 'economy',
                total_seats: value.economy_seats,
                extra_legroom_seats: value.economy_extra_legroom_seats || 0
            },
            {
                type: 'business',
                total_seats: value.business_seats,
                extra_legroom_seats: value.business_extra_legroom_seats || 0
            },
            {
                type: 'first_class',
                total_seats: value.first_class_seats,
                extra_legroom_seats: value.first_class_extra_legroom_seats || 0
            }
        ]

        for (const seatClass of classes) {
            const { type, total_seats } = seatClass;
            let extra = seatClass.extra_legroom_seats;

            for (let i = 0; i < total_seats; i++) {
                const seat = new seatSchema({
                    number: seat_number++,
                    type: type,
                    is_extra_legroom: extra > 0,
                    is_available: true,
                    flight: newFlight._id
                });

                await seat.save();
                extra--;
            }
        }



    } catch (error) {
        return res.status(500).json({
            message: "Error creating flight",
            error: error.message
        });
    }

    return res.status(200).json({
        message: "Hi!! :)",
        data: value
    });
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
        const flight = await flightSchema.findById(id)
            .populate('departure', 'name')
            .populate('destination', 'name')
            .populate('intermediary_stop', 'name');

        if (!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }


        const seats = await seatSchema.find({ flight: flight._id }, projection = { flight: 0, __v: 0 });

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


})

module.exports = router;