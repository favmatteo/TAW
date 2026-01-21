const Joi = require('joi');

const airportSchema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required(),
    code: Joi.string().required().length(3).uppercase(),
    country: Joi.string().required()
});

module.exports = airportSchema;
