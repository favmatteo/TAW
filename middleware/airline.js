const airlineModel = require('../models/airlines');

const is_airline = async (req, res, next) => {

    if (!req.id) {
        return res.status(401).json({
            message: "Missing id auth"
        });
    }

    const exists = await airlineModel.findById(req.id);
    if (!exists) {
        return res.status(401).json({
            message: "Unauthorized: Airline not found"
        });
    }

    next();
}

module.exports = is_airline;