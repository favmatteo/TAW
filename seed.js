const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Airline = require('./models/airlines');
const Aircraft = require('./models/aircraft');
const Route = require('./models/routes');
const Flight = require('./models/flight');
const Passenger = require('./models/passenger');
const Seat = require('./models/seat');

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

        // 1. Create Aircrafts
        const aircraft1 = new Aircraft({ name: 'Boeing 737' });
        const aircraft2 = new Aircraft({ name: 'Airbus A320' });
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
            departure: 'Milan',
            destination: 'New York',
            intermediary_stop: null
        });
        const route2 = new Route({
            flight_time: 90,
            departure: 'Rome',
            destination: 'Paris',
            intermediary_stop: null
        });
        const route3 = new Route({
            flight_time: 600,
            departure: 'London',
            destination: 'Tokyo',
            intermediary_stop: 'Dubai'
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
            aircraft: aircraft1._id
        });
        
        const flight2 = new Flight({
            economy_cost: 100,
            business_cost: 300,
            first_class_cost: 0,
            extra_baggage_cost: 30,
            departure_time: new Date(new Date().getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
            route: route2._id,
            aircraft: aircraft2._id
        });

        // Flight 3 on Route 3
        const flight3 = new Flight({
            economy_cost: 800,
            business_cost: 2000,
            first_class_cost: 5000,
            extra_baggage_cost: 100,
            departure_time: new Date(new Date().getTime() + 72 * 60 * 60 * 1000), // 3 days later
            route: route3._id,
            aircraft: aircraft1._id // Reuse aircraft 1 just for data
        });

        await flight1.save();
        await flight2.save();
        await flight3.save();

        // 5. Create Airline
        const airline = new Airline({
            name: 'SpaceAir',
            email: 'admin@spaceair.com',
            password: hashedPassword,
            flights: [flight1._id, flight2._id, flight3._id]
        });
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
