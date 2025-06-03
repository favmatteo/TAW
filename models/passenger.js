const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    money: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Passenger', passengerSchema);