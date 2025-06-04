const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const aircraftSchema = new mongoose.Schema({
    name: { type: String, required: true },
    

    flights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }]
});

module.exports = mongoose.model('Airline', airlineSchema);