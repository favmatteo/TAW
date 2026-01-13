const Joi = require('joi');

const signupSchema = Joi.object({
    name: Joi.string().required(),
    surname: Joi.string().required(),
    birth_date: Joi.date().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = signupSchema;