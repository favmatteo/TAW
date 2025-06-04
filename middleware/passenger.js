const passengerModel = require('../models/passenger');

const is_passenger = async (req, res, next) => {

    if (!req.id) {
        return res.status(401).json({
            message: "Missing id auth"
        });
    }

    req.passenger = await passengerModel.findById(req.id, {password: 0});

    const exists = req.passenger;
    if (!exists) {
        return res.status(401).json({
            message: "Unauthorized: Passenger not found"
        });
    }

    next();
}

module.exports = is_passenger;