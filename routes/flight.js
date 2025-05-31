const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const router = express.Router();

router.post("/create/", auth_airlines, async (req, res) => {
    
})