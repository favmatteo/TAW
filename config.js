const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seed = require('./seed');
dotenv.config();
/*
Connessione a MongoDB usando Mongoose. 
La stringa di connessione viene letta dalla variabile d'ambiente MONGO_URI.
Se la variabile d'ambiente SEED_DB è impostata a 'true', viene eseguita la funzione di seeding del database all'avvio.
*/
const uri = process.env.MONGO_URI;
mongoose.connect(
    uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => { 
        console.log("Connected to MongoDB"); 
        // Seed only when SEED_DB env var is set to 'true'
        if (process.env.SEED_DB === 'true') {
            console.log('avvio seed()');
            await seed();
        } else {
            console.log('Skipping seed on startup');
        }
    })
    .catch(err => { console.error("MongoDB connection error:", err); });

