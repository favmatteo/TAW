const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const buyTicketSchema = require('../schemas/ticket');
const flightSchema = require('../models/flight');
const seatSchema = require('../models/seat');
const ticketSchema = require('../models/ticket');

const is_passenger = require('../middleware/passenger');
const router = express.Router();

const calculatePriceOfSeat = async (seatType, flightId) => {
    const getPriceOfSeat = await flightSchema.findById(flightId, {
        economy_cost: 1,
        business_cost: 1,
        first_class_cost: 1,
        _id: 0
    })
    switch(seatType) {
        case 'economy':
            return getPriceOfSeat.economy_cost;
        case 'business':
            return getPriceOfSeat.business_cost;
        case 'first_class':
            return getPriceOfSeat.first_class_cost;
        default:
            throw new Error("Invalid seat type");
    }
}

router.post('/buy', auth, is_passenger, async (req, res) => {

    const { error, value } = buyTicketSchema.validate(req.body);
    if (error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }
    const { seat_number, extra_baggage, flight_id } = value;

    try {
        const seat = await seatSchema.findOne({ number: seat_number, flight: flight_id, is_available: true });
        if (!seat) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Seat is not available or doesn't exist"
            });
        }
        const price = await calculatePriceOfSeat(seat.type, flight_id);
        if(req.passenger.money < price) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Insufficient funds"
            });
        }
        req.passenger.money -= price;
        await passengerModel.findByIdAndUpdate(req.passenger._id, { money: req.passenger.money });

        value.is_available = false;
        await seatSchema.findOneAndUpdate(
            { number: seat_number, flight: flight_id },
            { is_available: false, is_extra_legroom: extra_baggage },
            { new: true }
        );

        const ticket = new ticketSchema({
            seat: seat._id,
            passenger: req.passenger._id,
            flight: flight_id,
            extra_baggage: extra_baggage,
            price: price
        });

        await ticket.save();

    }catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }

    return res.status(200).json({
        message: "Ticket purchase successful"
    })
})

module.exports = router;