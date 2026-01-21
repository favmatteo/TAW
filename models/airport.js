const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, minlength: 3, maxlength: 3 },
    country: { type: String, required: true }
});

module.exports = mongoose.model('Airport', airportSchema);
