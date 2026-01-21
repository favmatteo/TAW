const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const { validate } = require('./airlines');

const routesSchema = new mongoose.Schema({
    flight_time: { type: Number, required: true },
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },
    /*
    intermediary_stop: {type: String, default: null, required: false, 
        validate: {
            validator: function(value) {
                if (value && this.flight_time < 120) {
                    throw new Error('Intermediary stop is not allowed for flights less than 2 hours');
                }
                return true;
            },
            message: 'Invalid intermediary stop'
        }
    },
    */
});

module.exports = mongoose.model('Route', routesSchema);