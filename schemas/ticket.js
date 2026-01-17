const Joi = require('joi');

const singleTicketSchema = Joi.object({
    seat_number: Joi.number().required(),
    extra_baggage: Joi.boolean().default(false),
    flight_id: Joi.string().required()
});

const buyTicketSchema = Joi.alternatives().try(
    singleTicketSchema,
    Joi.array().items(singleTicketSchema)
);

module.exports = buyTicketSchema; 