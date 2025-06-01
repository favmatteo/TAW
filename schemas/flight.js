const Joi = require('joi');

const createFlightSchema = Joi.object({
    flight_time: Joi.number().required(),
    departure_time: Joi.string().required(),

    departure: Joi.string().required(),
    destination: Joi.string().required(),
    intermediary_stop: Joi.string().optional(),

    economy_cost: Joi.number().required(),
    business_cost: Joi.number().required(),
    first_class_cost: Joi.number().required(),

    economy_seats: Joi.number().required(),
    economy_seats_extra_legroom: Joi.number().required(),

    business_seats: Joi.number().required(),
    business_seats_extra_legroom: Joi.number().required(),

    first_class_seats: Joi.number().required(),
    first_class_seats_extra_legroom: Joi.number().required(),
});

module.exports = createFlightSchema;