const express = require('express');
const airlineModel = require('../models/airlines');
const auth = require('../middleware/auth');
const is_airline = require('../middleware/airline');
const createAircraftSchema = require('../schemas/aircraft');
const aircraftSchema = require('../models/aircraft');
const seatSchema = require('../models/seat');

const router = express.Router();

router.post('/create/', auth, is_airline, async (req, res) => {
    const {error, value} = createAircraftSchema.validate(req.body);
    if(error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }
    const {
        name,
        economy_seats,
        business_seats,
        first_class_seats,
        economy_seats_extra_legroom,
        business_seats_extra_legroom,
        first_class_seats_extra_legroom
    } = value;

    try {
        const newAircraft = new aircraftSchema({
            name,
            owner: req.id,
            seats: [] // Initialize empty seats array
        })
        
        let seat_number = 1; // Start seat numbering from 1
        const aircraftSeats = []; // Array to hold embedded seat objects for Aircraft

        const classes = [
            {
                type: 'economy',
                total_seats: economy_seats,
                extra_legroom_seats: economy_seats_extra_legroom || 0
            },
            {
                type: 'business',
                total_seats: business_seats,
                extra_legroom_seats: business_seats_extra_legroom || 0
            },
            {
                type: 'first_class',
                total_seats: first_class_seats,
                extra_legroom_seats: first_class_seats_extra_legroom || 0
            }
        ]

        for (const seatClass of classes) {
            const { type, total_seats, extra_legroom_seats } = seatClass;

            for (let i = 0; i < total_seats; i++) {
                const seatData = {
                    number: seat_number++,
                    type: type,
                    is_extra_legroom: i < extra_legroom_seats,
                    is_available: true,
                    aircraft: newAircraft._id
                };

                // Create separate Seat document (optional, but good for reference)
                const seat = new seatSchema(seatData);
                await seat.save();
                
                // Add to aircraft's embedded seats
                aircraftSeats.push(seat);
            }
        }
        
        newAircraft.seats = aircraftSeats;
        await newAircraft.save();

        return res.status(201).json({
            message: "Aircraft created successfully",
            aircraft: newAircraft
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }

})

router.get("/my-aircrafts", auth, is_airline, async (req, res) => {
    try {
        const aircrafts = await aircraftSchema.find({ owner: req.id });
        return res.status(200).json({ data: aircrafts });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching aircrafts", error: err.message });
    }
});

module.exports = router;