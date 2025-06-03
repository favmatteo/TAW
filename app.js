const express = require("express")
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT;


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});

const passengerRoutes = require('./routes/passenger');
app.use('/api/passenger/', passengerRoutes)

const airlineRoutes = require('./routes/airlines')
app.use('/api/airline/', airlineRoutes)

const flightRoutes = require('./routes/flight');
app.use('/api/flight/', flightRoutes)

const ticketRoutes = require('./routes/ticket');
app.use('/api/ticket/', ticketRoutes)

const config = require('./config');