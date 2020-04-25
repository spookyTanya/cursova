var express = require('express');
var router = express.Router();

router.get('/r', function(req, res, next) {
  res.render('error', {message: 'Ви ввели неправильну електронну пошту або пароль'})
});

module.exports = router;
