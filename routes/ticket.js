const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const is_passenger = require('../middleware/passenger');
const router = express.Router();

router.post('/buy', auth, is_passenger, async (req, res) => {



    return res.status(200).json({
        message: "Ticket purchase successful"
    })
})

module.exports = router;