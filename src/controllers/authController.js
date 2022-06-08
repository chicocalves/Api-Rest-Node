const express = require('express');
const User = require('../models/user');
const router = express.Router();
const connectToDatabase = require('../database');
const bcript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json') 

connectToDatabase();

function generateToken (params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
};

router.post('/register', async (req, res) => {
    try {
        const {email} = req.body;
        if(await User.findOne({email})){
            return res.status(400).send({ error: 'User already exists'});
        }

        const user = await User.create(req.body);
        user.password = undefined;
        res.send({ user, token: generateToken({id: user.id})});
    } catch (error) {
        return res.status(400).send({ error: 'Registration failed'});
    }
});

router.post('/authenticate', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email}).select('+password');

    if(!user || !await bcript.compare(password, user.password)){
        return res.status(400).send({ error: 'User ou password not found'});
    };

    user.password = undefined;

    res.send({ user, token: generateToken({id: user.id})});
})

module.exports = app => app.use('/auth', router);