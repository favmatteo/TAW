const passengerModel = require('../models/passenger');

const is_passenger = async (req, res, next) => {

    if (!req.id) {
        return res.status(401).json({
            message: "Missing id auth"
        });
    }

    const exists = await passengerModel.findById(req.id);
    if (!exists) {
        return res.status(401).json({
            message: "Unauthorized: Passenger not found"
        });
    }

    next();
}

module.exports = is_passenger;