const Joi = require('joi');

const createFlightSchema = Joi.object({
    route: Joi.string().required(),
    aircraft: Joi.string().required(),

    economy_cost: Joi.number().required(),
    business_cost: Joi.number().required(),
    first_class_cost: Joi.number().required(),
    extra_baggage_cost: Joi.number().required(),
    departure_time: Joi.date().required(),
});

module.exports = createFlightSchema;