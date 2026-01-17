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

const calculatePriceOfSeat = (seat, flight, extradBaggage) => {
    let price = 0;
    
    // Base price based on class
    switch(seat.type) {
        case 'economy':
            price = flight.economy_cost;
            break;
        case 'business':
            price = flight.business_cost;
            break;
        case 'first_class':
            price = flight.first_class_cost;
            break;
        default:
            throw new Error("Invalid seat type");
    }

    // Extra legroom
    if (seat.is_extra_legroom) {
        price += (flight.extra_legroom_cost || 0);
    }

    // Extra baggage
    if (extradBaggage) {
        price += flight.extra_baggage_cost;
    }

    return price;
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
    
    try {
        const flight = await flightModel.findById(flight_id).populate('aircraft');
        if(!flight) {
            return res.status(404).json({
                message: "Flight not found"
            });
        }

        // Find the seat embedded in the flight
        const seatIndex = flight.seats.findIndex(s => s.number === seat_number);
        if (seatIndex === -1) {
            return res.status(404).json({
                message: "Seat not found"
            });
        }

        const seat = flight.seats[seatIndex];

        if (!seat.is_available) {
            return res.status(409).json({
                message: "Seat is already taken"
            });
        }

        // Calculate price
        const price = calculatePriceOfSeat(seat, flight, extra_baggage);

        // Check funds
        if(req.passenger.money < price) {
            return res.status(400).json({
                message: "Insufficient funds",
                error: "You don't have enough money to buy this ticket"
            });
        }

        // Deduct money
        req.passenger.money -= price;
        await req.passenger.save();

        // Create ticket
        const ticket = new ticketModel({
            flight: flight._id,
            passenger: req.passenger._id,
            seat: seat._id,
            extra_baggage: extra_baggage,
            price: price,
            created_at: new Date()
        });

        // Update seat availability
        flight.seats[seatIndex].is_available = false;

        await ticket.save();
        await flight.save();

        res.status(201).json({
            message: "Ticket purchased successfully",
            ticket: {
                _id: ticket._id,
                flight: flight._id,
                seat_number: seat.number,
                price: price,
                extra_baggage: extra_baggage
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
});

router.get('/my-tickets', auth, is_passenger, async (req, res) => {
    try {
        const tickets = await ticketModel.find({ passenger: req.id })
            .populate({
                path: 'flight',
                populate: { path: 'route' } // Populate route inside flight to show destination
            })
            .sort({ created_at: -1 })
            .lean();

        // Enarich tickets with seat details found in flight.seats
        const enrichedTickets = tickets.map(ticket => {
            if (ticket.flight && ticket.flight.seats) {
                const seatInfo = ticket.flight.seats.find(s => s._id.toString() === ticket.seat.toString());
                if (seatInfo) {
                    ticket.seat_number = seatInfo.number;
                    ticket.seat_type = seatInfo.type;
                    ticket.is_extra_legroom = seatInfo.is_extra_legroom;
                }
                // Remove seats array from response to reduce payload size
                delete ticket.flight.seats;
            }
            return ticket;
        });

        return res.status(200).json({
            data: enrichedTickets
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
});

module.exports = router;