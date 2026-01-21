const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Airline = require('./models/airlines');
const Aircraft = require('./models/aircraft');
const Route = require('./models/routes');
const Flight = require('./models/flight');
const Passenger = require('./models/passenger');
const Seat = require('./models/seat');
const Airport = require('./models/airport');

const seed = async () => {
    try {
        const flightsCount = await Flight.countDocuments();
        if (flightsCount > 0) {
            console.log("Database already populated. Skipping seed.");
            return;
        }

        console.log("Seeding database...");

        // Password hash
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 0. Create or Update Airports
        const airportsData = [
            { name: 'Malpensa', city: 'Milan', code: 'MXP', country: 'Italy' },
            { name: 'John F. Kennedy', city: 'New York', code: 'JFK', country: 'USA' },
            { name: 'Fiumicino', city: 'Rome', code: 'FCO', country: 'Italy' },
            { name: 'Charles de Gaulle', city: 'Paris', code: 'CDG', country: 'France' },
            { name: 'Heathrow', city: 'London', code: 'LHR', country: 'UK' },
            { name: 'Haneda', city: 'Tokyo', code: 'HND', country: 'Japan' },
            { name: 'Dubai Intl', city: 'Dubai', code: 'DXB', country: 'UAE' }
        ];

        const createdAirports = {};
        for (const data of airportsData) {
            createdAirports[data.code] = await Airport.findOneAndUpdate(
                { code: data.code },
                data,
                { upsert: true, new: true }
            );
        }

        const mxp = createdAirports['MXP'];
        const jfk = createdAirports['JFK'];
        const fco = createdAirports['FCO'];
        const cdg = createdAirports['CDG'];
        const lhr = createdAirports['LHR'];
        const hnd = createdAirports['HND'];
        const dxb = createdAirports['DXB'];

        // 0b. Create or Get Airline
        let airline = await Airline.findOne({ email: 'admin@spaceair.com' });
        if (!airline) {
            airline = new Airline({
                name: 'SpaceAir',
                email: 'admin@spaceair.com',
                password: hashedPassword,
                flights: []
            });
            await airline.save();
        } else {
             // Reset flights if re-seeding logic implies fresh flights
             airline.flights = [];
             await airline.save();
        }

        // 1. Create Aircrafts
        const aircraft1 = new Aircraft({ name: 'Boeing 737', owner: airline._id });
        const aircraft2 = new Aircraft({ name: 'Airbus A320', owner: airline._id });
        await aircraft1.save();
        await aircraft2.save();

        // 2. Create Seats for Aircraft 1
        const seats = [];
        const seatTypes = ['economy', 'business', 'first_class'];
        // Create 30 seats
        for (let i = 1; i <= 30; i++) {
             // simplified logic for type
             let type = 'economy';
             if (i <= 4) type = 'first_class';
             else if (i <= 10) type = 'business';

             seats.push({
                 number: i,
                 type: type,
                 is_extra_legroom: i === 11 || i === 12, // Emergency exit rows
                 is_available: true,
                 aircraft: aircraft1._id
             });
        }
        await Seat.insertMany(seats);
        
        // Seats for Aircraft 2
         const seats2 = [];
        for (let i = 1; i <= 30; i++) {
             seats2.push({
                 number: i,
                 type: 'economy',
                 is_extra_legroom: false,
                 is_available: true,
                 aircraft: aircraft2._id
             });
        }
        await Seat.insertMany(seats2);

        // 3. Create Routes

        const route1 = new Route({
            flight_time: 480, // 8 hours
            departure: mxp._id,
            destination: jfk._id,
            owner: airline._id
        });
        const route2 = new Route({
            flight_time: 90,
            departure: fco._id,
            destination: cdg._id,
            owner: airline._id
        });
        const route3 = new Route({
            flight_time: 600,
            departure: lhr._id,
            destination: hnd._id,
            owner: airline._id,
            // intermediary_stop: dxb._id 
        });
        
        await route1.save();
        await route2.save();
        await route3.save();

        // 4. Create Flights
        const flight1 = new Flight({
            economy_cost: 500,
            business_cost: 1200,
            first_class_cost: 3000,
            extra_baggage_cost: 50,
            departure_time: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            route: route1._id,
            aircraft: aircraft1._id,
            owner: airline._id
        });
        
        const flight2 = new Flight({
            economy_cost: 100,
            business_cost: 300,
            first_class_cost: 0,
            extra_baggage_cost: 30,
            departure_time: new Date(new Date().getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
            route: route2._id,
            aircraft: aircraft2._id,
            owner: airline._id
        });

        // Flight 3 on Route 3
        const flight3 = new Flight({
            economy_cost: 800,
            business_cost: 2000,
            first_class_cost: 5000,
            extra_baggage_cost: 100,
            departure_time: new Date(new Date().getTime() + 72 * 60 * 60 * 1000), // 3 days later
            route: route3._id,
            aircraft: aircraft1._id, // Reuse aircraft 1 just for data
            owner: airline._id
        });

        await flight1.save();
        await flight2.save();
        await flight3.save();

        // 5. Update Airline
        airline.flights = [flight1._id, flight2._id, flight3._id];
        await airline.save();

        // 6. Create Passenger
        const passenger = new Passenger({
            name: 'Mario Rossi',
            email: 'mario@example.com',
            password: hashedPassword, // password123
            money: 5000
        });
        await passenger.save();

        console.log("Database seeded successfully!");

    } catch (error) {
        console.error("Seeding error:", error);
    }
};

module.exports = seed;
