const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    must_change_password: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },

    flights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }]
});

module.exports = mongoose.model('Airline', airlineSchema);