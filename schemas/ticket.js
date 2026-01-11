const Joi = require('joi');

const buyTicketSchema = Joi.object({
    seat_number: Joi.number().required(),
    extra_baggage: Joi.boolean().default(false),
    flight_id: Joi.string().required()
});

module.exports = buyTicketSchema; 