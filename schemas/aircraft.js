const Joi = require('joi');

const createAircraftSchema = Joi.object({
    name: Joi.string().required(),

    economy_seats: Joi.number().required(),
    economy_seats_extra_legroom: Joi.number().required(),

    business_seats: Joi.number().required(),
    business_seats_extra_legroom: Joi.number().required(),

    first_class_seats: Joi.number().required(),
    first_class_seats_extra_legroom: Joi.number().required(),
});

module.exports = createAircraftSchema;