const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const aircraftSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

module.exports = mongoose.model('Aircraft', aircraftSchema);