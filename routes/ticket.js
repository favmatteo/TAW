const express = require('express');
const passengerModel = require('../models/passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const loginSchema = require('../schemas/login');
const signupSchema = require('../schemas/signup')
const router = express.Router();

router.post('/buy', async (req, res) => {
})

module.exports = router;