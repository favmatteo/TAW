const mongoose = require('mongoose');
const Price = require('./price');
const flightSchema = new mongoose.Schema({

    economy_cost: { type: Price, required: true },
    business_cost: { type: Price, required: true },
    first_class_cost: { type: Price, required: true },

    departure_time: { type: Date, required: true },
    flight_time: { type: Number, required: true }, // In minuti

    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    intermediary_stop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: false,
        validate: {
            validator: (value) => {
                if (this.flight_time > 120 && !value) return false;
                else return true;
            }
        }
    },
});

module.exports = mongoose.model('Flight', flightSchema);