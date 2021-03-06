const express = require('express');
const User = require('../../app/models/user');
const router = express.Router();
const connectToDatabase = require('../../database');
const bcript = require('bcryptjs');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

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
        return res.status(400).send({ error: 'User or password not found'});
    };

    user.password = undefined;

    res.send({ user, token: generateToken({id: user.id})});
})

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if(!user){
            return res.status(400).send({ error: 'User not found or not already exists'});
        };

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        });

        mailer.sendMail({
            to: email,
            from: 'sistema@empresa.com.br',
            template: 'auth/forgot_password',
            context: { token },
        }, (err) => {
            if(err)
            console.log(err);
                return res.status(400).send({ error: 'Cannot send forgot password email'});

            return res.send();
        });

    } catch (error) {
        return res.status(400).send({ error: 'Erro on forgot password, try again'});
    }
});

module.exports = app => app.use('/auth', router);