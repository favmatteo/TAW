const mongoose = require('mongoose');
const flightSchema = new mongoose.Schema({

    economy_cost: { type: Number, required: true },
    business_cost: { type: Number, required: true },
    first_class_cost: { type: Number, required: true },

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