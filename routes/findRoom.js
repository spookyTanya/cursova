var express = require('express');
var router = express.Router();

const con = require('../db.js');
const helper =  require("../constants");

router.get('', helper.redirectLogin, function (req, res) {
    let sql = 'SELECT Id, BuildingName FROM `buildings`';

    con.query(sql, (error, result, fields) => {
        let buildingsArray = [];

        for (let i = 0; i < result.length; i++) {
            let data = {
                id: result[i].Id,
                name: result[i].BuildingName
            };

            buildingsArray.push(data);
        }

        let user = {
            userName: req.session.userName,
            isSuperUser: req.session.superuser
        };

        res.render('findRoom', {user: user, buildingsArray: buildingsArray});
    });
});

router.post('/find', helper.redirectLogin, function (req, res) {
    let sql = 'SELECT R.Id, R.Name, R.Accommodation, R.NumberOfComputers, R.HasProjector, `departments`.`DepartmentName`, `buildings`.`BuildingName`, `buildings`.`Street`, `buildings`.`HouseNumber` FROM `rooms` as R ' +
        'INNER JOIN `departments` ON `departments`.`Id` = R.`DepartmentId` ' +
        'INNER JOIN `buildings` ON `buildings`.`Id` = `departments`.`BuildingId` WHERE ';

    let k = 0;

    let values = Object.entries(req.body)
    let sheduleArray = values.filter(function (elem) {
        return elem[0].indexOf('shedule') !== -1;
    });
    let roomArray = values.filter(function (elem) {
        return elem[0].indexOf('R') !== -1;
    });
    let remaining = values.filter(function (elem) {
        return elem[0].indexOf('shedule') === -1 && elem[0].indexOf('R') === -1;
    });

    for (let [key, value] of remaining) {
        if (key !== 'HasProjector' && value !== '') {
            if (k > 0) {
                sql += ' AND ';
            }

            sql += key + ' = ' + value;
            k++;
        }
        if (key === 'HasProjector' && value === 'on') {
            sql += ' AND ' + key  + ' = 1 ';
        }
    }

    sql = addSheduleCheck(addRoomCheck(sql, roomArray), sheduleArray);

    console.log(sql)
    con.query(sql, (error, result, fields) => {
        if (error) {
            console.log('error', error);
        }

        console.log(result)

        let roomsArray = [];

        if (result) {
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
        }

        let user = {
            userName: req.session.userName,
            isSuperUser: req.session.superuser
        };

        res.render('rooms', {rooms: roomsArray, user: user});
    });
});

function addRoomCheck(sql, array) {
    if (array.length > 0) {
        sql += ' AND ';
        array.forEach(function (elem, index) {
            if (index !== 0) {
                sql += ' AND '
            }
            sql += elem[0] + ' >= ' + elem[1];
        });
    }

    return sql;
}

function addSheduleCheck(sql, array){
    if (array.length > 0) {
        sql += ' AND NOT EXISTS(SELECT * FROM `shedule` WHERE ';
        array.forEach(function (elem, index) {
            if (index !== 0) {
                sql += ' AND '
            }
            sql += elem[0] + ' = "' + elem[1] + '"';
        });
        sql += ')';
    }

    return sql;
}

module.exports = router;