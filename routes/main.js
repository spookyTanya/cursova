const express = require('express');
const router = express.Router();

const con = require('../db.js');
const helper =  require("../constants");

function prepareNotifications(weekArray, notifications) {
    for (let i = 0; i < 7; i++) {
        let today = getMonday(new Date());
        let d = new Date(today.setDate(today.getDate() + i));
        weekArray.push(d.getDate() + '.' + (d.getMonth() + 1));
        notifications[i].sort(function (a, b) {
            return a.lesson - b.lesson;
        });
    }
}

/*const redirectLogin = async (req, res, next) => {
    // console.log('to maaain', req.session);
    if (req.session.userName) {
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
    } else {
        res.redirect('/');
    }
};*/

router.get('/', helper.redirectLogin, function (req, res) {
    let today = getMonday(new Date());
    const midnight = today;
    midnight.setHours(0);
    midnight.setMinutes(0);

    let sql;

    console.log(midnight);

    if (req.session.superuser === 1) {
        sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, R.Name as rName, `departments`.`DepartmentName`, `buildings`.`BuildingName`, `buildings`.`Street`, `buildings`.`HouseNumber` FROM `shedule`, `rooms` as R ' +
            'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
            'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId` ' +
            'WHERE `Date` > "' + midnight.toISOString() + '" AND R.Id = shedule.RoomId ORDER BY `Date` ASC';
    } else {
        sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, R.Name as rName, `departments`.`DepartmentName`, `buildings`.`BuildingName`, `buildings`.`Street`, `buildings`.`HouseNumber` FROM `shedule`, `rooms` as R ' +
            'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
            'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId` ' +
            'WHERE `UserID` = "' + req.session.userId + '"AND `Date` > "' + midnight.toISOString() + '" AND R.Id = shedule.RoomId ORDER BY `Date` ASC';
    }

    console.log(sql);
    con.query(sql, (error, result, fields) => {
        if (error) {
            console.log('error', error);
        }
        let notificObj = {0: [], 1: [], 2: [], 3: [], 4:[], 5:[], 6:[]};
        // let notificObj = {1: [], 2: [], 3: [], 4:[], 5:[], 6:[], 7: []};
        let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
        let weekDate = [];
        let bookingsArray = [];

        for (let i = 0; i < result.length; i++) {
            let objDate = new Date(result[i].Date);
            // objDate.setHours(objDate.getHours() + 2);

            let data = {
                date: result[i].Date,
                lesson: result[i].NumberOfLesson,
                name: result[i].Name,
                room: result[i].rName,
                id: result[i].Id,
                teacher: result[i].Teacher,
                buildingName: result[i].BuildingName,
                street: result[i].Street,
                house: result[i].HouseNumber,
                depName: result[i].DepartmentName
            };

            if (objDate - today < 604800000) {
                notificObj[(objDate.getDay() - 1 + 7) % 7].push(data);
            }

            bookingsArray.push(data);
        }

        prepareNotifications(weekDate, notificObj);

        req.session.notifications = notificObj;
        req.session.allBooking = bookingsArray;

        res.render('main', {userName: req.session.userName, notification: req.session.notifications, days: days, weekDate: weekDate});
    });

});

router.get('/logout', function (req, res) {
    req.session.userName = '';
    req.session.userId = null;
    req.session.email = '';
    res.redirect('/')
});

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay();
    let diff = d.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(d.setDate(diff));
}

module.exports = router;