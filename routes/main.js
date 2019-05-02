const express = require('express');
const router = express.Router();
const con = require('../db.js');
const path = require('path');
const nodemailer = require('nodemailer');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

const $ = jQuery = require('jquery')(window);

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'tanyabilanyuk@gmail.com',
		pass: 'asahdude668841'
	}
});

const redirectLogin = async (req, res, next) => {
	// console.log('to maaain', req.session);
	if(req.session.userName) {
		// let today = new Date();
		// const midnight = new Date();
		// midnight.setHours(0);
		// midnight.setMinutes(0);
		// const sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, rooms.Name as rName FROM `shedule`, `rooms` WHERE `UserID` = "' + req.session.userId + '"AND `Date` > "' + midnight.toISOString() + '" AND rooms.Id = shedule.RoomId';
		// con.query(sql, (error, result, fields) => {
		// 	if(error) {
		// 		console.log('error', error);
		// 	}
		// 	let notificArray = [];
		// 	let bookingsArray = [];
		// 	for(let i=0; i<result.length; i++){
		// 		let objDate = new Date(result[i].Date);
		// 		let data = {
		// 			date: result[i].Date,
		// 			lesson: result[i].NumberOfLesson,
		// 			name: result[i].Name,
		// 			room: result[i].rName,
		// 			id: result[i].Id,
		// 		};
		// 		if(objDate - today < 604800000){
		// 			notificArray.push(data);
		// 		}
		// 		bookingsArray.push(data);
		// 	}
		// 	req.session.notifications = notificArray;
		// 	req.session.allBooking = bookingsArray;
		// 	next();
		// });
        next();
	} else{
		res.redirect('/');
	}
};

router.get('/', redirectLogin, function(req, res) {
    let today = new Date();
    const midnight = new Date();
    midnight.setHours(0);
    midnight.setMinutes(0);
    var sql;
    if(req.session.superuser == 1){
    	sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, rooms.Name as rName FROM `shedule`, `rooms` WHERE `Date` > "' + midnight.toISOString() + '" AND rooms.Id = shedule.RoomId ORDER BY `Date` ASC';
	} else {
        sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, rooms.Name as rName FROM `shedule`, `rooms` WHERE `UserID` = "' + req.session.userId + '"AND `Date` > "' + midnight.toISOString() + '" AND rooms.Id = shedule.RoomId ORDER BY `Date` ASC';
    }
    con.query(sql, (error, result, fields) => {
        if(error) {
            console.log('error', error);
        }
        let notificArray = [];
        let bookingsArray = [];
        for(let i=0; i<result.length; i++){
            let objDate = new Date(result[i].Date);
            let data = {
                date: result[i].Date.toLocaleDateString(),
                lesson: result[i].NumberOfLesson,
                name: result[i].Name,
                room: result[i].rName,
                id: result[i].Id,
            };
            if(objDate - today < 604800000){
                notificArray.push(data);
            }
            bookingsArray.push(data);
        }
        req.session.notifications = notificArray;
        req.session.allBooking = bookingsArray;
        res.render('main', {userName: req.session.userName, notification: req.session.notifications});
    });

});

router.get('/mybooking', redirectLogin, function(req, res) {
	res.render('mybookings', {items: req.session.allBooking, userName: req.session.userName });
});

router.get('/mybooking/delete/:id', redirectLogin, function(req, res) {
	const sql = 'DELETE FROM `shedule` WHERE `Id` = "' + req.params.id + '"';
	console.log('delete', sql);
	con.query(sql, (error, result, fields) => {
		if(error){
			console.log(error);
		}
		res.redirect('/');
	});
});

router.get('/mybooking/edit/:id', redirectLogin, function(req, res) {
	const sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, rooms.Name as rName FROM `shedule`, `rooms` WHERE shedule.Id = "' + req.params.id + '" AND rooms.Id = shedule.RoomId';
	con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		if(result) {
			// console.log(result[0].Date);
			// console.log(new Date(result[0].Date));
			let data = {
				date: result[0].Date,
				lesson: result[0].NumberOfLesson,
				name: result[0].Name,
				room: result[0].rName,
				teacher: result[0].Teacher,
				id: req.params.id
			};
			res.render('editBooking', {booking: data, userName: req.session.userName});
		}
	});	
	
});

router.post('/mybooking/editSend', redirectLogin, function(req, res){
	// console.log('date -- ', req.body.newdate);
	let data = {
		date: req.body.newdate,
		name: req.body.name,
		id: req.body.ID,
		roomName: req.body.room,
		lesson: req.body.lesson,
		teacher: req.body.teacher
	};
	today = new Date();
	targetDate = new Date(req.body.newdate);
	if(targetDate - today < 0){
        res.render('error', {message: 'You entered invalid date'});
	} else {
		console.log('fine');
	}
	const check = 'SELECT Date, rooms.Name, NumberOfLesson FROM `shedule`, `rooms` WHERE `Date` = "' + data.date + '" AND `NumberOfLesson` = "' + data.lesson + '" AND `RoomId` = (SELECT Name FROM `rooms` WHERE Name = "' + data.roomName + '")';
	con.query(check, (error, result, fields) => {
		if(result.length < 1){
			const sql = 'UPDATE `shedule` SET `NumberOfLesson` = "' + data.lesson + '", `Teacher` = "' + data.teacher + '", `Date` = "' + data.date + '", `Name` = "' + data.name + '", `RoomId` = (SELECT Id FROM `rooms` WHERE Name = "' + data.roomName + '") WHERE `Id` = "' + data.id + '"';
			console.log(sql);
			con.query(sql, (error, result, fields) => {
				if(error) {
					console.log('error', error);
				}
				const mailOptions = {
				  from: 'tanyabilanyuk@gmail.com',
				  to: req.session.email,
				  subject: 'Бронювання аудиторій',
				  html: `<div>Ваше бронювання №${data.id} було змінено <br> 
						Нова інформація: <br> 
						Назва: ${data.name} <br> 
						Дата: ${data.date} <br> 
						Номер пари: ${data.lesson} <br> 
						Кабінет: ${data.roomName} </div>`,
				};

				transporter.sendMail(mailOptions, function(error, info){
				  if (error) {
				    console.log(error);
				  } else {
				    console.log('Email sent: ' + info.response);
				  }
				});
				res.redirect('/main');
			});
		}
	});
});

router.get('/createPage', redirectLogin, function(req, res){
	// res.sendFile(path.join(__dirname, '../views' ,'/createBooking.ejs'));
	res.render('createBooking', {userName: req.session.userName});
});

router.post('/createPage/create', redirectLogin, function(req, res){
	let data = {
		date: req.body.date,
		name: req.body.name,
		room: req.body.room,
		lesson: req.body.lesson,
		teacher: req.body.teacher
	};
	let today = new Date();
	let targetDate = new Date(data.date);
	if(targetDate - today < 0){
		res.render('error', {message: 'You entered invalid date'});
	} else {
		const checkRoom = 'SELECT * FROM `rooms` WHERE `Name` = "' + data.room + '"';
		con.query(checkRoom, (error, result, fields) => {
			// console.log('res', result);
			if(result.length < 1) {
                res.render('error', {message: 'You entered invalid room name'});
			} else {
				console.log('mamma mia', result[0].Name);
				const check = 'SELECT Date, rooms.Name, NumberOfLesson FROM `shedule`, `rooms` WHERE `Date` = "' + data.date + '" AND `NumberOfLesson` = "' + data.lesson + '" AND `RoomId` = (SELECT Id FROM `rooms` WHERE Name = "' + data.room + '")';
				// console.log(check);
				con.query(check, (error, result, fields) => {
					if(result.length < 1){
						const sql = 'INSERT INTO `shedule` (`NumberOfLesson`, `Teacher`, `UserID`, `Date`, `Name`, `RoomId`) VALUES ("' + data.lesson + '", "' + data.teacher + '", "' + req.session.userId + '", "' + data.date + '", "' + data.name + '", (SELECT Id FROM `rooms` WHERE Name = "' + data.room + '"))';
						console.log(sql);
						con.query(sql, (error, result, fields) => {
							if(error) {
							console.log('error', error) ;
							}
								const mailOptions = {
								  	from: 'tanyabilanyuk@gmail.com',
								  	to: req.session.email,
								  	subject: 'Бронювання аудиторій',
								  	html: `<div>Вітаю, Ви створили бронювання аудиторії! <br> 
										Детальніша інформація: <br> 
										Назва: ${data.name} <br> 
										Дата: ${data.date} <br> 
										Номер пари: ${data.lesson} <br> 
										Кабінет: ${data.room} <br>
										Викладач: ${data.teacher} </div>`,
								};
								transporter.sendMail(mailOptions, function(error, info){
									if (error) {
									    console.log(error);
								  	} else {
								    	console.log('Email sent: ' + info.response);
								  	}
								});
								res.redirect('/main');
							
						});
					} else {
                        res.render('error', {message: 'For this date room is already booked'});
					}
				});		
			}
		});
		
	}
});

router.get('/rooms', redirectLogin, function(req, res){
	const sql = 'SELECT * FROM `rooms`';
	con.query(sql, (error, result, fields) => {
		if(error) {
			console.log('error', error);
		}
		let roomsArray = [];
		for(let i=0; i<result.length; i++){
			let data = {
				id: result[i].Id,
				name: result[i].Name,
				accom: result[i].Accommodation,
				computers: result[i].NumberOfComputers,
				projector: result[i].HasProjector
			};
			roomsArray.push(data);
		}
		res.render('rooms', {rooms: roomsArray, userName: req.session.userName});
	});
});

router.get('/rooms/shedule/:id/:date', redirectLogin, function(req, res){
	let today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	let targetDate = new Date();
	targetDate.setHours(23);
	targetDate.setMinutes(59);
	if(req.params.date == 'week'){
		targetDate.setDate(targetDate.getDate() + 7);
	} else if(req.params.date == 'tomorrow'){
		targetDate.setDate(targetDate.getDate() + 1);
	} 
	const sql = 'SELECT * FROM `shedule` WHERE `Date` >= "' + today.toISOString() + '" AND `Date` <= "' + targetDate.toISOString() + '" AND RoomId = "' + req.params.id + '"';
	console.log(sql);
	con.query(sql, (err, result, fields) => {
		if(result){
			let sheduleArray = [];
			for(let i=0; i<result.length; i++){
				let data = {
					date: result[0].Date,
					lesson: result[0].NumberOfLesson,
					name: result[0].Name,
					teacher: result[0].Teacher
				};
				sheduleArray.push(data);
			}
			res.render('shedule', {shedule: sheduleArray, days: req.params.date, userName: req.session.userName});
		}
	});

});

router.get('/logout', function(req, res){
	req.session.userName = '';
	req.session.userId = null;
	req.session.email = '';
	res.redirect('/')
});

module.exports = router;