const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mainRouter = require('./routes/main');
const createRouter = require('./routes/createPage');
const bookingRouter = require('./routes/bookings');
const finderRouter = require('./routes/findRoom');
const roomRouter = require('./routes/rooms');
const addRoomRouter = require('./routes/addRoom');

const app = express();

// view engine setup	
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));


app.use(bodyParser.urlencoded({
	extended: true
}));

//вернути
let options = {
	host: "us-cdbr-iron-east-03.cleardb.net",
  	user: "b137b481565ba4",
  	password: "3d0e4252",
  	database: "heroku_656924a3d6f9fc3"
};
let sessionStore = new MySQLStore(options);

app.use(session({
	key: 'myCookie',
	secret: 'secret12345',
	store: sessionStore,
	resave: false,
	saveUninitialized: false,
	cookie: {
		originalMaxAge: 1000 * 60 * 60,
		maxAge: 1000 * 60 * 60,
		//secure: true,
		path: '/',
		//httpOnly: false,
	}
}));

app.use((req, res, next) => {
	req.session.init = 'init';
	next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/main', mainRouter);
app.use('/main/createPage', createRouter);
app.use('/main/mybooking', bookingRouter);
app.use('/main/findRoom', finderRouter);
app.use('/main/rooms', roomRouter);
app.use('/main/addRoom', addRoomRouter);

app.get('/', function(req, res){
	res.redirect('/main');
});
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
