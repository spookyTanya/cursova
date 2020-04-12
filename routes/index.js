const express = require('express');
const router = express.Router();
const passwordHash = require('password-hash');

const con = require('../db.js');

const redirectMain = (req, res, next) => {
	console.log('to login', req.session);
	if(req.session.userName) {
		res.redirect('/main/mybooking');
	} else{
		next();
	}
};

const checkPassword = (pass, hash) => {
    return passwordHash.verify(pass, hash);
};

const assignSession = (session, email, otherData) => {
	let newData = {
		email: email,
		userName: otherData.Name + ' ' + otherData.Surname,
		userId: otherData.Id,
		superuser: otherData.IsSuperuser
	};

	Object.assign(session, newData);

	return false;
};

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

/*function processNewUserInfo(userData, request, response) {

}*/

module.exports = router;
