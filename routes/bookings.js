var express = require('express');
var router = express.Router();

const con = require('../db.js');
const helper =  require("../constants");

function sendUserMail(userMail, bookingInfo) {
    const mailOptions = {
        from: 'tanyabilanyuk@gmail.com',
        to: userMail,
        subject: 'Бронювання аудиторій',
        html: `<div>Ваше бронювання №${bookingInfo.id} було змінено <br>
                Нова інформація: <br>
                Назва: ${bookingInfo.name} <br>
                Дата: ${bookingInfo.date} <br>
                Номер пари: ${bookingInfo.lesson} <br>
                Кабінет: ${bookingInfo.roomName} </div>`,
    };

    helper.emailTransporter.sendMail(mailOptions);
}

function checkDate(date) {
    let today = new Date();
    let targetDate = new Date(date);

    return targetDate - today > 0;
}

function removeElement(array, id){
    array.forEach((elem, index) => {
        if (elem.id === parseInt(id)) {
            array = array.splice(index, 1);
            return;
        }
    });
}

router.get('/', helper.redirectLogin, function (req, res) {
    res.render('mybookings', {items: req.session.allBooking, userName: req.session.userName});
});

router.get('/delete/:id', helper.redirectLogin, function (req, res) {
    const sql = 'DELETE FROM `shedule` WHERE `Id` = "' + req.params.id + '"';
    console.log('delete', sql);
    con.query(sql, (error, result, fields) => {
        if (error) {
            console.log(error);
        }

        removeElement(req.session.allBooking, req.params.id);
        removeElement(req.session.notifications, req.params.id);

        res.redirect('/main');
    });
});

router.get('/edit/:id', helper.redirectLogin, function (req, res) {
    /*const sql = 'SELECT shedule.Id, NumberOfLesson, Teacher, Date, shedule.Name, rooms.Name as rName FROM `shedule`, `rooms` WHERE shedule.Id = "' + req.params.id + '" AND rooms.Id = shedule.RoomId';
    con.query(sql, (error, result, fields) => {
        if (error) {
            console.log('error', error);
        }
        if (result) {
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
    });*/

    let copy = [...req.session.allBooking];
    let editElem = copy.filter(elem => elem.id === parseInt(req.params.id));
    res.render('editBooking', {booking: editElem[0], userName: req.session.userName});

});

router.post('/editSend', helper.redirectLogin, function (req, res) {
    let data = {
        date: req.body.newdate,
        name: req.body.name,
        id: req.body.ID,
        roomName: req.body.room,
        lesson: req.body.lesson,
        teacher: req.body.teacher
    };

    /*let today = new Date();
    let targetDate = new Date(req.body.newdate);

    if (targetDate - today < 0) {
    } else {
        console.log('fine');
    }*/

    if(checkDate(req.body.newdate) === true) {

        const check = 'SELECT Date, rooms.Name, NumberOfLesson FROM `shedule`, `rooms` WHERE `Date` = "' + data.date + '" AND `NumberOfLesson` = "' + data.lesson + '" AND `RoomId` = (SELECT Name FROM `rooms` WHERE Name = "' + data.roomName + '")';

        con.query(check, (error, result, fields) => {
            if (result.length < 1) {

                const sql = 'UPDATE `shedule` SET `NumberOfLesson` = "' + data.lesson + '", `Teacher` = "' + data.teacher + '", `Date` = "' + data.date + '", `Name` = "' + data.name + '", `RoomId` = (SELECT Id FROM `rooms` WHERE Name = "' + data.roomName + '") WHERE `Id` = "' + data.id + '"';
                console.log(sql);

                con.query(sql, (error, result, fields) => {
                    if (error) {
                        console.log('error', error);
                    }

                    // sendUserMail(req.session.email, data);

                    res.redirect('/main');
                });
            }
        });
    } else {
        res.render('error', {message: 'Вибрана дата вже минула'});
    }
});

module.exports = router;