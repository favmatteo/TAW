const priceSchema = {
    amount: { type: 'number', required: true },
    currency: { type: 'string', required: true },
}

module.exports = priceSchema;