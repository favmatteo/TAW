const express = require("express")
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});

const passengerRoutes = require('./routes/passenger');
app.use('/api/passenger/', passengerRoutes)

const config = require('./config');