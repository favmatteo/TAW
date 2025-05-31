const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI;
mongoose.connect(
    uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => { console.log("Connected to MongoDB"); })
    .catch(err => { console.error("MongoDB connection error:", err); });

