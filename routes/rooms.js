var express = require('express');
var router = express.Router();

const con = require('../db.js');
const helper =  require("../constants");

function prepareDate(dateType) {
    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);

    let targetDate = new Date();
    targetDate.setHours(23);
    targetDate.setMinutes(59);

    if (dateType == 'week') {
        targetDate.setDate(targetDate.getDate() + 7);
    } else if (dateType == 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    return {
        today: today,
        targetDate: targetDate
    }
}

router.get('/', helper.redirectLogin, function (req, res) {
    const sql = 'SELECT R.Id, R.Name, R.Accommodation, R.NumberOfComputers, R.HasProjector, `departments`.`DepartmentName`, `buildings`.`BuildingName`, `buildings`.`Street`, `buildings`.`HouseNumber` FROM `rooms` as R ' +
        'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
        'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId`';

    con.query(sql, (error, result, fields) => {
        if (error) {
            //res.render()
            console.log('error', error);
        }

        let roomsArray = [];

        for (let i = 0; i < result.length; i++) {
            let data = {
                id: result[i].Id,
                name: result[i].Name,
                accom: result[i].Accommodation,
                computers: result[i].NumberOfComputers,
                projector: result[i].HasProjector,
                buildingName: result[i].BuildingName,
                street: result[i].Street,
                house: result[i].HouseNumber,
                depName: result[i].DepartmentName
            };

            roomsArray.push(data);
        }

        res.render('rooms', {rooms: roomsArray, userName: req.session.userName});
    });
});

router.get('/shedule/:id/:date', helper.redirectLogin, function (req, res) {
    /*let today = new Date();
    today.setHours(0);
    today.setMinutes(0);

    let targetDate = new Date();
    targetDate.setHours(23);
    targetDate.setMinutes(59);

    if (req.params.date == 'week') {
        targetDate.setDate(targetDate.getDate() + 7);
    } else if (req.params.date == 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
    }*/

    let dateObj = prepareDate(req.params.date);

    const sql = 'SELECT S.Name, S.NumberOfLesson, S.Date, S.Teacher, rooms.Name as rName, departments.DepartmentName, buildings.BuildingName FROM `shedule` as S ' +
        'INNER JOIN rooms on rooms.Id = S.RoomId ' +
        'INNER JOIN departments on rooms.DepartmentId = departments.Id ' +
        'INNER JOIN buildings on departments.BuildingId = buildings.Id ' +
        'WHERE S.`Date` >= "' + dateObj.today.toISOString() + '" AND S.`Date` <= "' + dateObj.targetDate.toISOString() + '" AND S.RoomId = "' + req.params.id + '"';
    console.log(sql);

    con.query(sql, (err, result, fields) => {
        if (result) {
            let sheduleArray = [];
            let room = result[0].rName + ' кафедри ' + result[0].DepartmentName.toLowerCase() + ', ' + result[0].BuildingName;

            for (let i = 0; i < result.length; i++) {
                let data = {
                    date: result[i].Date.toISOString(),
                    lesson: result[i].NumberOfLesson,
                    name: result[i].Name,
                    teacher: result[i].Teacher
                };

                sheduleArray.push(data);
            }

            res.render('shedule', {shedule: sheduleArray, userName: req.session.userName, room: room});
        }
    });

});

module.exports = router;