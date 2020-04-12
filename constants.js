const nodemailer = require('nodemailer');

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
        user: 'tanyabilanyuk@gmail.com',
        pass: 'asahdude668841'
    }
});

module.exports = {
    redirectLogin: redirectLogin,
    emailTransporter: transporter,
};