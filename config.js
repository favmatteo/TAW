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
        await seed();
    })
    .catch(err => { console.error("MongoDB connection error:", err); });

