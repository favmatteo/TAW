const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const seat = require('./seat');

const aircraftSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },
    params: {type: Object, required: false}, // Store seat config for reference if needed

    seats: [seat.schema],
    // Seats are stored in Seat collection with ref to aircraft
});

module.exports = mongoose.model('Aircraft', aircraftSchema);