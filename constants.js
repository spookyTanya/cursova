const nodemailer = require('nodemailer');
require('dotenv').config();

const redirectLogin = async (req, res, next) => {
    if (req.session.userName) {
        next();
    } else {
        res.redirect('/');
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

module.exports = {
    redirectLogin: redirectLogin,
    emailTransporter: transporter,
};