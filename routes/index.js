const express = require('express');
const router = express.Router();
const passwordHash = require('password-hash');

const con = require('../db.js');
const helper = require("../constants");

router.get('/', redirectMain, function(req, res, next) {
	res.render('login');
});

router.post('/signin', redirectMain,  function(req, res) {
	const data = {
		email: req.body.email,
		password:  req.body.password,
	};

	// const sql = 'SELECT `Id`, `Name`, `Surname`, `IsSuperuser` FROM `users` WHERE `Email` = "' + data.email + '" AND `Password` = "' + data.password + '"';
	const sql = 'SELECT `Id`, `Name`, `Surname`, `IsSuperuser`, `Password` FROM `users` WHERE `Email` = "' + data.email + '"';

	console.log(sql);
	con.query(sql, (error, result, fields) => {
		if (error) {
			console.log('error', error);
		}
		// if (result.length > 0) {
		if (result.length > 0 && checkPassword(data.password, result[0].Password) === true) {
            assignSession(req.session, data.email, result[0]);

            res.redirect('/main');
        } else {
			res.render('error', {message: 'Ви ввели неправильну електронну пошту або пароль'});
		}
	});
});


router.post('/signup', redirectMain, function(req, res) {
	const data = {
		email: req.body.email,
		password:  req.body.password,
		name: req.body.name,
		surname: req.body.surname
	};																								

    const sql = 'SELECT * FROM `users` WHERE `Email` = "' + data.email + '"';
    con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		if(result.length > 0) {
			res.render('error', {message: 'Електронна пошта ' + data.email + ' вже зайнята'});
		} else {
            const hash = passwordHash.generate(data.password);
			const insert = 'INSERT INTO `users` (`Name`, `Email`, `Password`, `Surname`) VALUES ("'+  data.name + '", "' + data.email + '", "' + hash + '", "' + data.surname + '") ';
			con.query(insert, function processNewUserInfo(err, result) {
			    if (err) throw err;
				const sql = 'SELECT `Id`, `IsSuperuser` FROM `users` WHERE `Email` = "' + data.email + '"';
				con.query(sql, (error, result, fields) => {
					if(result.length > 0){

						assignSession(req.session, data.email, result[0]);

						res.redirect('/main');
					}
				});
		  	});
		}
	});
});

router.get('/forgot', redirectMain, function (req, res) {
	res.render('forgotPassword');
});

router.post('/resetConfirm', redirectMain, function (req, res) {
	const userEmail = req.body.email;
	const sql = 'SELECT * FROM `users` WHERE `Email` = "' + userEmail + '"';
	con.query(sql, (error, result, fields) => {
		if (result.length > 0) {
			const hash = generateHash(25);

			sendResetEmail(userEmail, hash);

			const sql = 'INSERT INTO `passwordChangeRequests`(`Id`, `UserId`) VALUES ("' + hash + '", ' + result[0].Id + ')';
			console.log(sql);

			con.query(sql, (error, result, fields) => {
				res.redirect('/');
			});
		} else {
			res.render('error', {message: 'Не знайдено користувача з такою електронною поштою'});
		}
	});
});

router.get('/forgot/:token', redirectMain, function (req, res) {
	const token = req.params.token;
	const sql = 'SELECT Time, UserId FROM `passwordChangeRequests` WHERE Id = "' + token + '"';

	con.query(sql, (error, result, fields) => {
		if (result.length > 0) {
			const time = new Date(result[0].Time);
			const now = new Date();
			const expirationTime = new Date(time.setHours(time.getHours() + 6));

			if (now.getTime() > expirationTime.getTime()) {
				res.render('error', {message: 'Час існування токену минув'});
			} else {
				res.render('newPassword', {userId: result[0].UserId});
			}

		} else {
			res.render('error', {message: 'Неіснуючий токен'});
		}
	});


});

router.post('/resetPassword', redirectMain, function (req, res) {
	const sql = 'UPDATE `users` SET `Password` = "' + passwordHash.generate(req.body.password) + '" WHERE `Id` = "' + req.body.userId + '"';

	console.log(sql);
	con.query(sql, (error, result, fields) => {
		res.redirect('/');
	});
});

/*function processNewUserInfo(userData, request, response) {

}*/


function redirectMain(req, res, next) {
	if(req.session.userName) {
		res.redirect('/main/mybooking');
	} else{
		next();
	}
}

function checkPassword(pass, hash) {
	return passwordHash.verify(pass, hash);
}

function assignSession(session, email, otherData) {
	let newData = {
		email: email,
		userName: otherData.Name + ' ' + otherData.Surname,
		userId: otherData.Id,
		superuser: otherData.IsSuperuser
	};

	Object.assign(session, newData);

	return false;
}

function sendResetEmail(email, hash) {
	console.log(process.env.mailSender)
	const mailOptions = {
		from:    process.env.mailSender,
		to:      email,
		subject: 'Бронювання аудиторій',
		html:    `<div>Щоб відновити обліковий запис, перейдіть по посиланню: <br>
                  <a href="http://localhost:5000/forgot/${hash}">Створити новий пароль</a>
                   </div>`,
	};

	helper.emailTransporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}


function generateHash(length) {
	let result           = '';
	let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


module.exports = router;
