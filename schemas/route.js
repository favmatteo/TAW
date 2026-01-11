const Joi = require('joi');

const routeSchema = Joi.object({
    flight_time: Joi.number().required(),
    departure: Joi.string().required(),
    destination: Joi.string().required(),
    intermediary_stop: Joi.string().optional(),
});

module.exports = routeSchema;