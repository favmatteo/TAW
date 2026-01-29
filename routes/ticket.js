const express = require('express');
const mongoose = require('mongoose');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const buyTicketSchema = require('../schemas/ticket');

const flightModel = require('../models/flight');
const seatModel = require('../models/seat');
const ticketModel  = require('../models/ticket');
require('../models/routes');
require('../models/airport');

const is_passenger = require('../middleware/passenger');
const router = express.Router();


// Funzione per calcolare il prezzo di un posto a sedere
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

// Endpoint per acquistare i biglietti, solo da passeggeri autenticati
router.post('/buy', auth, is_passenger, async (req, res) => {
    const { error, value } = buyTicketSchema.validate(req.body);
    if(error || !value) {
        return res.status(400).json({
            message: "Bad Request",
            error: error ? error.details[0].message : "Invalid data",
        });
    }

    const requests = Array.isArray(value) ? value : [value];
    
    try {
        let totalCost = 0;
        const purchaseOps = []; 
        // Verifica la disponibilità dei posti e calcola il costo totale
        for (const reqItem of requests) {
            const { seat_number, extra_baggage, flight_id } = reqItem;
            
            const flight = await flightModel.findById(flight_id).populate('aircraft');
            if(!flight) throw new Error(`Flight not found`);

            const seatIndex = flight.seats.findIndex(s => s.number === seat_number);
            if (seatIndex === -1) throw new Error(`Seat ${seat_number} not found in flight`);
            
            const seat = flight.seats[seatIndex];
            if (!seat.is_available) throw new Error(`Seat ${seat_number} in flight is already taken`);

            if (purchaseOps.some(op => op.flight._id.equals(flight._id) && op.seatIndex === seatIndex)) {
                 throw new Error(`Cannot buy the same seat twice in one request`);
            }

            const price = calculatePriceOfSeat(seat, flight, extra_baggage);
            totalCost += price;

            purchaseOps.push({ flight, seat, seatIndex, price, extra_baggage });
        }

        // Controlla se il passeggero ha abbastanza soldi
        if(req.passenger.money < totalCost) {
            return res.status(400).json({
                message: "Insufficient money",
                error: "You don't have enough money to buy these tickets"
            });
        }

        req.passenger.money -= totalCost;
        await req.passenger.save();
        
        const createdTickets = [];

        for (const op of purchaseOps) {
             const { flight, seat, price, extra_baggage } = op;

             await flightModel.updateOne(
                 { _id: flight._id, "seats._id": seat._id },
                 { $set: { "seats.$.is_available": false } }
             );

             const ticket = new ticketModel({
                flight: flight._id,
                passenger: req.passenger._id,
                seat: seat._id,
                extra_baggage: extra_baggage,
                price: price,
                created_at: new Date()
            });
            await ticket.save();
            createdTickets.push(ticket);
        }

        res.status(201).json({
            message: "Ticket(s) purchased successfully",
            tickets: createdTickets,
            remaining_money: req.passenger.money
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Purchase failed",
            error: err.message
        });
    }
});

// Endpoint per ottenere i biglietti acquistati dal passeggero autenticato
router.get('/my-tickets', auth, is_passenger, async (req, res) => {
    try {
        const tickets = await ticketModel.find({ passenger: req.id })
            .populate({
                path: 'flight',
                populate: { 
                    path: 'route',
                    model: 'Route',
                    populate: [
                        { path: 'departure', model: 'Airport' },
                        { path: 'destination', model: 'Airport' }
                    ]
                }
            })
            .sort({ created_at: -1 })
            .lean();

            // Ottenere le informazioni sui posti a sedere associati ai biglietti
            const enrichedTickets = tickets.map(ticket => {
            if (ticket.flight && ticket.flight.seats) {
                const seatInfo = ticket.flight.seats.find(s => s._id.toString() === ticket.seat.toString());
                if (seatInfo) {
                    ticket.seat_number = seatInfo.number;
                    ticket.seat_type = seatInfo.type;
                    ticket.is_extra_legroom = seatInfo.is_extra_legroom;
                }
                // Rimuovi il posto a sedere completo per evitare ridondanza
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