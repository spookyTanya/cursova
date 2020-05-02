const express = require('express');
const router = express.Router();

const con = require('../db.js');
const helper = require("../constants");

router.get('/', helper.redirectLogin, function (req, res) {
    let buildingsArray = [];

    /*const checkRoom = 'SELECT R.Name, `departments`.`DepartmentName`, `buildings`.`BuildingName` FROM `rooms` as R ' +
        'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
        'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId`';*/
    const getBuildings = 'SELECT BuildingName, Id FROM `buildings`';
    con.query(getBuildings, (error, result, fields) => {
        for (let i = 0; i < result.length; i++) {
            let element = {
                id: result[i].Id,
                buildName: result[i].BuildingName,
            };

            buildingsArray.push(element);
        }

        let user = {
            userName: req.session.userName,
            isSuperUser: req.session.superuser
        };

        res.render('createBooking', {user: user, buildings: buildingsArray, recommendation: createRecommendations(req.session.allBooking)});
    });
});

router.post('/create', helper.redirectLogin, function (req, res) {
    let data = {
        date: req.body.date,
        name: req.body.name,
        room: req.body.room,
        lesson: req.body.lesson,
        teacher: req.body.teacher
    };

    let today = new Date();
    let targetDate = new Date(data.date);
    if (targetDate - today < 0) {
        res.render('error', {message: 'Вибрана дата вже минула'});
    } else {
        const check = 'SELECT Date, rooms.Name FROM `shedule`, `rooms` WHERE `Date` = "' + data.date + '" AND `NumberOfLesson` = "' + data.lesson + '" AND `RoomId` = (SELECT Id FROM `rooms` WHERE Name = "' + data.room + '")';
        // console.log(check);
        con.query(check, (error, result, fields) => {
            addNewBooking(data, res, req, result);
        });

    }
});

router.get('/getRooms/:buildingId', function (req, res) {
    let roomsArray = [];
    const getRooms = 'SELECT R.Name, R.Id, `departments`.`DepartmentName` FROM `rooms` as R ' +
        'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
        'WHERE `departments`.`BuildingId` = ' + req.params.buildingId;

    con.query(getRooms, (error, result, fields) => {
        for (let i = 0; i < result.length; i++) {
            roomsArray.push({
                id: result[i].Id,
                depName: result[i].DepartmentName,
                name: result[i].Name
            });
        }
        res.json({rooms: roomsArray});
    });
});

function addNewBooking(data, response, request, prevRes) {
    if (prevRes.length < 1) {
        const sql = 'INSERT INTO `shedule` (`NumberOfLesson`, `Teacher`, `UserID`, `Date`, `Name`, `RoomId`) VALUES ("' + data.lesson + '", "' + data.teacher + '", "' + request.session.userId + '", "' + data.date + '", "' + data.name + '", "' + data.room + '")';
        console.log(sql);
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log('error', error);
            }

            sendUserMail(request.session.email, data);

            response.redirect('/main');

        });
    } else {
        response.render('error', {message: 'На вибрані дату та час аудиторія зайнята'});
    }
}

function sendUserMail(userMail, bookingInfo) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: userMail,
        subject: 'Бронювання аудиторій',
        html: `<div>Вітаю, Ви створили бронювання аудиторії! <br>
                Детальніша інформація: <br>
                Назва: ${bookingInfo.name} <br>
                Дата: ${bookingInfo.date} <br>
                Номер пари: ${bookingInfo.lesson} <br>
                Кабінет: ${bookingInfo.room} <br>
                Викладач: ${bookingInfo.teacher} </div>`,
    };

    helper.emailTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function createRecommendations(bookings) {
    let copy = [...bookings];
    let result = [];

    if (copy.length > 0) {
        let mostPopular = copy.sort((a, b) =>
            copy.filter(elem => elem.room === a.room).length
            - copy.filter(elem => elem.room === b.room).length
        ).pop();

        result.push(mostPopular.room);

        let i = 0;
        while (i < 2) {
            copy = copy.filter(elem => elem.room !== mostPopular.room);
            mostPopular = copy.pop();

            if (mostPopular !== undefined) {
                result.push(mostPopular.room);
                i++;
            } else {
                break;
            }
        }
    }

    return result;
}


module.exports = router;