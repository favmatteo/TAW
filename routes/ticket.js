const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const buyTicketSchema = require('../schemas/ticket');

const flightModel = require('../models/flight');
const seatModel = require('../models/seat');
const ticketModel  = require('../models/ticket');

const is_passenger = require('../middleware/passenger');
const router = express.Router();

const calculatePriceOfSeat = async (seatType, flightId) => {
    const getPriceOfSeat = await flightModel.findById(flightId, {
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
    if(error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    const { seat_number, extra_baggage, flight_id } = value;
    try{
        const flight = await flightModel.findById(flight_id).populate('aircraft');
        if(!flight) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Flight does not exist"
            });
        }
        const seat = await seatModel.findOne({ number: seat_number, aircraft: flight.aircraft._id, is_available: true });
        if(!seat) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Seat is not available or doesn't exist"
            });
        }

        const price = (await calculatePriceOfSeat(seat.type, flight_id) + (extra_baggage ? flight.extra_baggage_cost : 0)).toFixed(2);

        if(req.passenger.money < price) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Insufficient funds"
            });
        }

        req.passenger.money -= price;
        await passengerModel.findByIdAndUpdate(req.passenger._id, { money: req.passenger.money });
        
        await seatModel.findOneAndUpdate(
            { _id: seat._id, aircraft: flight.aircraft._id },
            { is_available: false },
            { new: true }
        );
        
        const ticket = new ticketModel({
            seat: seat._id,
            passenger: req.passenger._id,
            flight: flight_id,
            price: price,

            extra_baggage: extra_baggage,

            created_at: new Date()
        });

        await ticket.save();
        return res.status(200).json({
            message: "Ticket purchased successfully",
            data: {
                ticket_id: ticket._id,
                seat_number: seat.number,
                flight_id: flight_id,
                price: price,
                extra_baggage: extra_baggage
            }
        });

    }catch(err) {
        return res.status(400).json({
            message: "Bad Request",
            error: err.message
        });
    }


})

module.exports = router;