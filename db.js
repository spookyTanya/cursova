var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cursova"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

setInterval(function () {
    con.query('SELECT 1 from users');
}, 5000);

module.exports = con;