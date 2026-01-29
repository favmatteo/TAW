const express = require("express")
const dotenv = require("dotenv");
dotenv.config();

/*
Spiegazione:
Questo file rappresenta il punto di ingresso principale per un'applicazione backend basata su Express.js.
Gestisce la configurazione del server, l'importazione delle rotte nella cartella ./routes e l'avvio del server.

*/
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});

const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://frontend:4200',
    'http://taw-frontend:4200'
  ],
}));


const passengerRoutes = require('./routes/passenger');
app.use('/api/passenger/', passengerRoutes)

const airlineRoutes = require('./routes/airlines')
app.use('/api/airline/', airlineRoutes)

const routeRoutes = require('./routes/route');
app.use('/api/route/', routeRoutes);

const flightRoutes = require('./routes/flight');
app.use('/api/flight/', flightRoutes)

const ticketRoutes = require('./routes/ticket');
app.use('/api/ticket/', ticketRoutes)

const aircraftRoutes = require('./routes/aircraft');
app.use('/api/aircraft/', aircraftRoutes);

const airportRoutes = require('./routes/airport');
app.use('/api/airport/', airportRoutes);

const config = require('./config');