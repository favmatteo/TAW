const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({

    economy_cost: { type: Number, required: true },
    business_cost: { type: Number, required: true },
    first_class_cost: { type: Number, required: true },
    extra_baggage_cost: { type: Number, required: true },

    departure_time: { type: Date, required: true },

    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    aircraft: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft', required: true },
});

module.exports = mongoose.model('Flight', flightSchema);