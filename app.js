var express = require('express');
var expressValidator = require('express-validator');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var util = require('util');
var flash = require('connect-flash');
var cradle = require('cradle');
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//couch db connection
 var c = new(cradle.Connection)('http://localhost',5984, {
  cache : true,
  raw   : false,
  forceSave : true,
  request : { }
});
//Database request and existence
var db = c.database('bookreview');
db.exists(function(err,exists){
  if(err) {
    console.log('Error ' + err);
  } else if (exists) {
    console.log('Connection successfull');
    console.log('Database exists');
  } else {
    console.log("Database doesn't exists");
    db.create();
  }
});

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//Use express session
app.use(session({
  secret : 'happy coding folks',
  saveUninitialized : true,
  resave : true
}));
//Passport intialise
app.use(passport.initialize());
//Passport session
app.use(passport.session());

//Express validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//Connect flash
app.use(flash());
//Express messages 
app.use(function(req,res,next){
  res.locals.messages = require('express-messages')(req,res);
  next();
});
//Pass local variables as global
app.get('*',function(req,res,next){
  res.locals.user = req.user;
  next();
});

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
