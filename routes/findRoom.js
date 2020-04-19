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
    for (let [key, value] of Object.entries(req.body)) {
        if (key !== 'HasProjector' && value !== '') {
            if (k > 0) {
                sql += ' AND ';
            }
            if (key.indexOf('R') !== -1) {
                sql += key + ' >= ' + value;
            } else {
                sql += key + ' = ' + value;
            }
            k++;
        }
        if (key === 'HasProjector' && value === 'on') {
            sql += ' AND ' + key  + ' = 1 ';
        }
    }

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

module.exports = router;