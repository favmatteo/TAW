const airlineModel = require('../models/airlines');

const is_airline = async (req, res, next) => {

    if (!req.id) {
        return res.status(401).json({
            message: "Missing id auth"
        });
    }

    req.airline = await airlineModel.findById(req.id, { password: 0 });
    const exists = req.airline;
    if (!exists) {
        return res.status(401).json({
            message: "Unauthorized: Airline not found"
        });
    }

    next();
}

module.exports = is_airline;