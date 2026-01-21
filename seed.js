const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Airline = require('./models/airlines');
const Aircraft = require('./models/aircraft');
const Route = require('./models/routes');
const Flight = require('./models/flight');
const Passenger = require('./models/passenger');
const Seat = require('./models/seat');
const Ticket = require('./models/ticket');
const Airport = require('./models/airport');

const seed = async () => {
    try {
        console.log("Seeding database with realistic data including Airports...");

        // 0. Clear existing data
        await Ticket.deleteMany({});
        await Flight.deleteMany({});
        await Route.deleteMany({});
        await Aircraft.deleteMany({});
        await Passenger.deleteMany({});
        await Airline.deleteMany({});
        await Seat.deleteMany({});
        await Airport.deleteMany({});

        console.log("Cleared existing data.");

        // Password hash
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin', 10);

        // 1. Create Airports (Realistic international hubs)
        const mxp = new Airport({ name: 'Malpensa Airport', city: 'Milan', code: 'MXP', country: 'Italy' });
        const fra = new Airport({ name: 'Frankfurt Airport', city: 'Frankfurt', code: 'FRA', country: 'Germany' });
        const jfk = new Airport({ name: 'John F. Kennedy International Airport', city: 'New York', code: 'JFK', country: 'USA' });
        const fco = new Airport({ name: 'Fiumicino Airport', city: 'Rome', code: 'FCO', country: 'Italy' });
        const atl = new Airport({ name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', code: 'ATL', country: 'USA' });
        const cdg = new Airport({ name: 'Charles de Gaulle Airport', city: 'Paris', code: 'CDG', country: 'France' });
        const lhr = new Airport({ name: 'Heathrow Airport', city: 'London', code: 'LHR', country: 'UK' });
        const hnd = new Airport({ name: 'Haneda Airport', city: 'Tokyo', code: 'HND', country: 'Japan' });

        await mxp.save();
        await fra.save();
        await jfk.save();
        await fco.save();
        await atl.save();
        await cdg.save();
        await lhr.save();
        await hnd.save();

        console.log("Airports created.");

        // 2. Create Airlines
        const lufthansa = new Airline({
            name: 'Lufthansa',
            email: 'admin@lufthansa.com',
            password: hashedPassword,
            flights: []
        });

        const delta = new Airline({
            name: 'Delta Airlines',
            email: 'admin@delta.com',
            password: hashedPassword,
            flights: []
        });

        const ba = new Airline({
             name: 'British Airways',
             email: 'admin@ba.com',
             password: hashedPassword,
             flights: []
        });

        await lufthansa.save();
        await delta.save();
        await ba.save();
        console.log("Airlines created.");

        // 3. Create Passengers
        const passengersData = [
            { name: 'Admin User', email: 'admin@admin.com', money: 999999, password: adminPassword }, // Admin User
            { name: 'Mario Rossi', email: 'mario@example.com', money: 5000, password: hashedPassword },
            { name: 'Giulia Bianchi', email: 'giulia@example.com', money: 8000, password: hashedPassword },
            { name: 'John Doe', email: 'john@example.com', money: 2500, password: hashedPassword }
        ];

        const passengers = [];
        for (const p of passengersData) {
            const passenger = new Passenger({
                name: p.name,
                email: p.email,
                password: p.password,
                money: p.money
            });
            await passenger.save();
            passengers.push(passenger);
        }
        console.log("Passengers created.");

        // 4. Create Aircrafts
        // Helper to generate seats
        const createSeats = (total, businessCount, aircraftId) => {
            const seats = [];
            for (let i = 1; i <= total; i++) {
                let type = 'economy';
                if (i <= businessCount) type = 'business';
                
                // Extra legroom logic: emergency exits usually
                // Simple logic: row after business and middle of plane
                const isExtra = (i > businessCount && i <= businessCount + 6) || (i > total/2 && i <= total/2 + 6);

                seats.push({
                    number: i,
                    type: type,
                    is_extra_legroom: isExtra,
                    is_available: true,
                    aircraft: aircraftId
                });
            }
            return seats;
        };

        // Lufthansa A320
        const aircraftLh1 = new Aircraft({ name: 'Airbus A320neo', owner: lufthansa._id, seats: [] });
        aircraftLh1.seats = createSeats(180, 24, aircraftLh1._id);
        await aircraftLh1.save();

        // Lufthansa B747 (Long haul)
        const aircraftLh2 = new Aircraft({ name: 'Boeing 747-8', owner: lufthansa._id, seats: [] });
        aircraftLh2.seats = createSeats(360, 50, aircraftLh2._id);
        await aircraftLh2.save();

        // Delta B777
        const aircraftDl1 = new Aircraft({ name: 'Boeing 777-200LR', owner: delta._id, seats: [] });
        aircraftDl1.seats = createSeats(300, 40, aircraftDl1._id);
        await aircraftDl1.save();

        // BA A320
        const aircraftBa1 = new Aircraft({ name: 'Airbus A320', owner: ba._id, seats: [] });
        aircraftBa1.seats = createSeats(170, 20, aircraftBa1._id);
        await aircraftBa1.save();
        
        // BA B777
        const aircraftBa2 = new Aircraft({ name: 'Boeing 777-300', owner: ba._id, seats: [] });
        aircraftBa2.seats = createSeats(250, 40, aircraftBa2._id);
        await aircraftBa2.save();

        console.log("Aircrafts created.");

        // 5. Create Routes (Using Airport IDs)
        
        // Lufthansa Routes
        const routeMxpFra = new Route({
            flight_time: 85,
            departure: mxp._id, // Airport ID
            destination: fra._id, // Airport ID
            owner: lufthansa._id
        });
        const routeFraJfk = new Route({
            flight_time: 520,
            departure: fra._id,
            destination: jfk._id,
            owner: lufthansa._id
        });

        // Delta Routes
        const routeFcoAtl = new Route({
            flight_time: 660,
            departure: fco._id,
            destination: atl._id,
            owner: delta._id
        });
        const routeAtlJfk = new Route({
             flight_time: 135,
             departure: atl._id,
             destination: jfk._id,
             owner: delta._id
        });

        // BA Routes
        const routeFcoLhr = new Route({
            flight_time: 160, 
            departure: fco._id,
            destination: lhr._id,
            owner: ba._id
        });
        const routeLhrHnd = new Route({
             flight_time: 830, // ~14h
             departure: lhr._id,
             destination: hnd._id,
             owner: ba._id
        });

        await routeMxpFra.save();
        await routeFraJfk.save();
        await routeFcoAtl.save();
        await routeAtlJfk.save();
        await routeFcoLhr.save();
        await routeLhrHnd.save();

        console.log("Routes created.");

        // 6. Create Flights with Layover Logic
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        // --- Sequence 1: MXP -> FRA -> JFK (Lufthansa) ---
        // Leg 1: MXP -> FRA
        const depTime1 = new Date(tomorrow); depTime1.setHours(9, 30, 0, 0); // 09:30
        const flightMxpFra = new Flight({
            economy_cost: 150,
            business_cost: 400,
            first_class_cost: 0,
            extra_baggage_cost: 40,
            extra_legroom_cost: 20,
            departure_time: depTime1,
            route: routeMxpFra._id,
            aircraft: aircraftLh1._id,
            owner: lufthansa._id
        });

        // Leg 2: FRA -> JFK
        const depTime2 = new Date(tomorrow); depTime2.setHours(13, 0, 0, 0); // 13:00 (Layover 2h after arr ~11:00)
        const flightFraJfk = new Flight({
            economy_cost: 600,
            business_cost: 2500,
            first_class_cost: 0,
            extra_baggage_cost: 80,
            extra_legroom_cost: 100,
            departure_time: depTime2,
            route: routeFraJfk._id,
            aircraft: aircraftLh2._id,
            owner: lufthansa._id
        });

        // --- Sequence 2: FCO -> ATL -> JFK (Delta) ---
        // Leg 1: FCO -> ATL (Long haul start)
        const depTime3 = new Date(tomorrow); depTime3.setHours(10, 0, 0, 0); // 10:00
        const flightFcoAtl = new Flight({
            economy_cost: 750,
            business_cost: 3000,
            first_class_cost: 8000,
            extra_baggage_cost: 100,
            extra_legroom_cost: 150,
            departure_time: depTime3,
            route: routeFcoAtl._id,
            aircraft: aircraftDl1._id,
            owner: delta._id
        });

        // Leg 2: ATL -> JFK (Domestic connection)
        const depTime4 = new Date(tomorrow); depTime4.setHours(23, 0, 0, 0);
        const flightAtlJfk = new Flight({
             economy_cost: 180,
             business_cost: 450,
             first_class_cost: 0,
             extra_baggage_cost: 40,
             departure_time: depTime4,
             route: routeAtlJfk._id,
             aircraft: aircraftDl1._id, // Using same plane type but physically different theoretically, but for seed ok
             owner: delta._id
        });
        
        // --- Sequence 3: FCO -> LHR -> HND (British Airways) ---
        // Leg 1: FCO -> LHR
        const depTime5 = new Date(tomorrow); depTime5.setHours(14, 0, 0, 0); 
        const flightFcoLhr = new Flight({
            economy_cost: 200,
            business_cost: 500,
            first_class_cost: 0,
            extra_baggage_cost: 50,
            departure_time: depTime5,
            route: routeFcoLhr._id,
            aircraft: aircraftBa1._id,
            owner: ba._id
        });

        // Leg 2: LHR -> HND
        const depTime6 = new Date(tomorrow); depTime6.setHours(19, 0, 0, 0);
        const flightLhrHnd = new Flight({
             economy_cost: 900,
             business_cost: 4000,
             first_class_cost: 9000,
             extra_baggage_cost: 120,
             departure_time: depTime6,
             route: routeLhrHnd._id,
             aircraft: aircraftBa2._id,
             owner: ba._id
        });

        await flightMxpFra.save();
        await flightFraJfk.save();
        await flightFcoAtl.save();
        await flightAtlJfk.save();
        await flightFcoLhr.save();
        await flightLhrHnd.save();

        console.log("Flights created.");

        // 7. Update Airlines with flights
        lufthansa.flights.push(flightMxpFra._id, flightFraJfk._id);
        await lufthansa.save();

        delta.flights.push(flightFcoAtl._id, flightAtlJfk._id);
        await delta.save();

        ba.flights.push(flightFcoLhr._id, flightLhrHnd._id);
        await ba.save();
        
        console.log("Airlines updated.");

        // 8. Create Tickets (Simulation of booking)
        
        // Booking MXP -> FRA -> JFK for Passenger 2 (Mario)
        let f1 = await Flight.findById(flightMxpFra._id);
        let s1 = f1.seats.find(s => s.number === 12); // Economy
        
        if (s1) {
            const t1 = new Ticket({
                extra_baggage: false,
                passenger: passengers[1]._id,
                flight: flightMxpFra._id,
                seat: s1._id,
                price: 150
            });
            s1.is_available = false;
            await f1.save();
            await t1.save();
        }

        let f2 = await Flight.findById(flightFraJfk._id);
        let s2 = f2.seats.find(s => s.number === 55); // Economy
        if (s2) {
             const t2 = new Ticket({
                extra_baggage: true,
                passenger: passengers[1]._id,
                flight: flightFraJfk._id,
                seat: s2._id,
                price: 600 + 80
            });
            s2.is_available = false;
            await f2.save();
            await t2.save();
        }

        console.log("Sample tickets created.");
        console.log("Database seeded successfully!");

    } catch (error) {
        console.error("Seeding error:", error);
    }
};

module.exports = seed;
