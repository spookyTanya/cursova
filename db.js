var mysql = require('mysql');

var con = mysql.createPool({
  host: "us-cdbr-iron-east-03.cleardb.net",
  user: "b137b481565ba4",
  password: "3d0e4252",
  database: "heroku_656924a3d6f9fc3"
});

/*
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cursova"
});

con.connect(function(err) {
  console.log("Connected!");
});

setInterval(function () {
    con.query('SELECT 1 from users');
}, 5000);
*/

module.exports = con;