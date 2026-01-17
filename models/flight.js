const mongoose = require('mongoose');
const seat = require('./seat');

const flightSchema = new mongoose.Schema({

    economy_cost: { type: Number, required: true },
    business_cost: { type: Number, required: true },
    first_class_cost: { type: Number, required: true },
    extra_baggage_cost: { type: Number, required: true },
    extra_legroom_cost: { type: Number, default: 20 }, // Costo default per extra legroom

    departure_time: { type: Date, required: true },

    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    aircraft: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },
    
    seats: [seat.schema],
});
/*
Trigger che copia lo schema di seat riferito all'aircraft del volo
*/

flightSchema.pre('save', async function(next) {
    if (this.isNew && this.aircraft) {
        try {
            const Aircraft = mongoose.model('Aircraft');
            const aircraft = await Aircraft.findById(this.aircraft);
            
            if (aircraft && aircraft.seats && aircraft.seats.length > 0) {
                // Copia i posti dall'aircraft, resettando la disponibilità
                this.seats = aircraft.seats.map(seat => ({
                    number: seat.number,
                    type: seat.type,
                    is_extra_legroom: seat.is_extra_legroom,
                    is_available: true,
                    aircraft: this.aircraft // Mantiene il riferimento all'aircraft
                }));
            }
        } catch (error) {
            console.error("Error fetching aircraft seats:", error);
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Flight', flightSchema);