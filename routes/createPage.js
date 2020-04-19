const express = require('express');
const router = express.Router();

const con = require('../db.js');
const helper = require("../constants");

function sendUserMail(userMail, bookingInfo) {
    const mailOptions = {
        from: process.env.mailSender,
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

    return result;
}

router.get('/', helper.redirectLogin, function (req, res) {
    let roomsArray = [];

    const checkRoom = 'SELECT R.Name, `departments`.`DepartmentName`, `buildings`.`BuildingName` FROM `rooms` as R ' +
        'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
        'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId`';
    con.query(checkRoom, (error, result, fields) => {
        for (let i = 0; i < result.length; i++) {
            let element = {
                name: result[i].Name,
                depName: result[i].DepartmentName,
                building: result[i].BuildingName
            };

            roomsArray.push(element);
        }

        let user = {
            userName: req.session.userName,
            isSuperUser: req.session.superuser
        };

        res.render('createBooking', {user: user, rooms: roomsArray, recommendation: createRecommendations(req.session.allBooking)});
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
        const check = 'SELECT Date, rooms.Name, NumberOfLesson FROM `shedule`, `rooms` WHERE `Date` = "' + data.date + '" AND `NumberOfLesson` = "' + data.lesson + '" AND `RoomId` = (SELECT Id FROM `rooms` WHERE Name = "' + data.room + '")';
        // console.log(check);
        con.query(check, (error, result, fields) => {
            if (result.length < 1) {
                const sql = 'INSERT INTO `shedule` (`NumberOfLesson`, `Teacher`, `UserID`, `Date`, `Name`, `RoomId`) VALUES ("' + data.lesson + '", "' + data.teacher + '", "' + req.session.userId + '", "' + data.date + '", "' + data.name + '", (SELECT Id FROM `rooms` WHERE Name = "' + data.room + '"))';
                console.log(sql);
                con.query(sql, (error, result, fields) => {
                    if (error) {
                        console.log('error', error);
                    }

                    // sendUserMail(req.session.email, data);

                    res.redirect('/main');

                });
            } else {
                res.render('error', {message: 'На вибрані дату та час аудиторія зайнята'});
            }
        });

    }
});

module.exports = router;