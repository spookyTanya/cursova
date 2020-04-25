var express = require('express');
var router = express.Router();

const con = require('../db.js');
const helper =  require("../constants");

router.get('', helper.redirectLogin, function (req, res) {
    let sql = 'SELECT Id, DepartmentName FROM `departments`';

    con.query(sql, (error, result, fields) => {
        let departmentsArray = [];

        for (let i = 0; i < result.length; i++) {
            let data = {
                id: result[i].Id,
                name: result[i].DepartmentName
            };

            departmentsArray.push(data);
        }
        let user = {
            userName: req.session.userName,
            isSuperUser: req.session.superuser
        };

        res.render('addRoom', {user: user, departmentsArray: departmentsArray});
    });
});

router.post('/create', helper.redirectLogin, function (req, res) {
    let sql = 'SELECT * FROM `rooms` WHERE Name = "' + req.body.name + '" AND DepartmentId = "' + req.body.department + '"';

    con.query(sql, (error, result, fields) => {
        if (result.length > 0) {
            res.render('error', {message: 'Така аудиторія вже існує'});
        } else {
            let projector = req.body.HasProjector || 0;
            sql = 'INSERT INTO `rooms`(`Name`, `Accommodation`, `NumberOfComputers`, `HasProjector`, `DepartmentId`) ' +
                'VALUES ("' + req.body.name + '", ' + req.body.accommodation + ', ' + req.body.noc + ', ' + projector + ', ' + req.body.department + ')';

            con.query(sql, (error, result, fields) => {
                res.redirect('/main/rooms');
            });
        }
    });
});

module.exports = router;