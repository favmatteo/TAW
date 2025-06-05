const aircraftModel = require('../models/aircraft');
const mongoose = require('mongoose');
const routeSchema = require('../models/routes');

const route_exists = async (id) => {
    if (!id || !mongoose.isValidObjectId(id)) {
        return false;
    }

    try {
        const route = await routeSchema.findById(id);
        if(route && route !== null) return true;
        return false;
    }catch(err) {
        throw new Error("Error checking route existence: " + err.message);
    }
}

const aircraft_exists = async (id) => {
    if (!id || !mongoose.isValidObjectId(id)) {
        return false;
    }

    try {
        const aircraft = await aircraftModel.findById(id);
        if(aircraft && aircraft != null) {
            return true;
        }
        return false;
    }catch(err) {
        throw new Error("Error checking aircraft existence: " + err.message);
    }
}

module.exports = {
    route_exists,
    aircraft_exists
};