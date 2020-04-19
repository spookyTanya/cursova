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

transporter.set('oauth2_provision_cb', (user, renew, callback)=>{
    let accessToken = userTokens[user];
    if(!accessToken){
        return callback(new Error('Unknown user'));
    }else{
        return callback(null, accessToken);
    }
});

module.exports = {
    redirectLogin: redirectLogin,
    emailTransporter: transporter,
};