const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    extra_baggage: { type: Boolean, default: false, required: true },

    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Passenger', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },

    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ticket', ticketSchema);