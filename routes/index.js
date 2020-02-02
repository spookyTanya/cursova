const express = require('express');
const router = express.Router();

const con = require('../db.js');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

const $ = jQuery = require('jquery')(window);

const redirectMain = (req, res, next) => {
	console.log('to login', req.session);
	if(req.session.userName) {
		res.redirect('/main/mybooking');
	} else{
		next();
	}
};

router.get('/', redirectMain, function(req, res, next) {
	res.render('login');
});

router.get('/helloworld', function(req, res) {
    res.render('helloworld', { title: 'tanya!' });
});

router.post('/signin', redirectMain,  function(req, res) {
	const data = {
		email: req.body.email,
		password:  req.body.password,
	};

	const sql = 'SELECT `Id`, `Name`, `Surname`, `IsSuperuser` FROM `users` WHERE `Email` = "' + data.email + '" AND `Password` = "' + data.password + '"';
	console.log('sql', sql);
	con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		console.log('resuuuuuuuuult', result);
		if(result.length > 0) {
            req.session.userName = result[0].Name + ' ' + result[0].Surname;
            req.session.userId = result[0].Id;
            req.session.email = req.body.email;
            req.session.superuser = result[0].IsSuperuser;
            res.redirect('/main');
        } else {
			res.render('error', {message: 'User does not exist'});
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
			res.render('error', {message: 'email ' + data.email + ' is already taken'});
		} else {
			const insert = 'INSERT INTO `users` (`Name`, `Email`, `Password`, `Surname`) VALUES ("'+  data.name + '", "' + data.email + '", "' + data.password + '", "' + data.surname + '") ';
			con.query(insert, function (err, result) {
			    if (err) throw err;
				const sql = 'SELECT `Id`, `IsSuperuser` FROM `users` WHERE `Email` = "' + data.email + '"';
				con.query(sql, (error, result, fields) => {
					if(result.length > 0){
						req.session.userId = result[0].Id;
                        req.session.userName = data.name + ' ' + data.surname;
                        req.session.email = data.email;
                        req.session.superuser = result[0].IsSuperuser;
						res.redirect('/main');
					} else {
						console.log('wrooong');
					}
				});
		  	});
		}
	});
});

module.exports = router;
