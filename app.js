var express = require('express');
var util = require('util');
var expressValidator = require('express-validator');
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//couch db connection and database call
var db = require('nano')('http://localhost:5984/bookreview');
console.log((db.config.db === 'bookreview') ? 'Database connected' : 'No database available');

var index = require('./routes/index');
var users = require('./routes/users');
var review = require('./routes/review');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 
//Use express session
app.use(session({
  secret : 'happycodingfolks',
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
app.use('/review', review);

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
