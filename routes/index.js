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
		res.redirect('/main');
	} else{
		next();
	}
}

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

	const sql = 'SELECT `Id`, `Name`, `Surname` FROM `users` WHERE `Email` = "' + data.email + '" AND `Password` = "' + data.password + '"';
	con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		req.session.userName = result[0].Name + ' ' + result[0].Surname;
		req.session.userId = result[0].Id;
		req.session.email = req.body.email;
		console.log('session', req.session, result);
		res.redirect('/main');
	});
});


router.post('/signup', redirectMain, function(req, res) {
	const data = {
		email: req.body.email,
		password:  req.body.password,
		name: req.body.name,
		surname: req.body.surname
	};																								

    const sql = 'SELECT * FROM `users` WHERE `Email` = "' + data.email + '" AND `Password` = "' + data.password + '"';
	con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		if(result.length > 0) {
			alert('Email is already taken');
		} else {
			const insert = 'INSERT INTO `users` (`Name`, `Email`, `Password`, `Surname`) VALUES ("'+  data.name + '", "' + data.email + '", "' + data.password + '", "' + data.surname + '") ';
			con.query(insert, function (err, result) {
			    if (err) throw err;
			    req.session.userName = data.name + ' ' + data.email;
				req.session.email = req.body.email;
				const sql = 'SELECT `Id` FROM `users` WHERE `Email` = "' + req.session.email + '"';
				con.query(sql, (error, result, fields) => {
					if(result){
						req.session.userId = result[0].Id;
						res.redirect('/main');
					}
				});
				
		  	});
		}
	});
});

module.exports = router;
