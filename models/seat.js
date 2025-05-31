const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    number: { type: String, required: true },

    type: {
        type: String,
        enum: ['economy', 'business', 'first_class'],
        required: true
    },
    is_extra_legroom: { type: Boolean, default: false, required: true },
    is_available: { type: Boolean, default: true, required: true },


    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
});

module.exports = mongoose.model('Seat', seatSchema);