const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seed = require('./seed');
dotenv.config();

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
            console.log('SEED_DB=true -> running seed()');
            await seed();
        } else {
            console.log('SEED_DB not set -> skipping seed on startup');
        }
    })
    .catch(err => { console.error("MongoDB connection error:", err); });

