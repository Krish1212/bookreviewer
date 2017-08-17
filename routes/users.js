var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//couch db connection and database call
var db = require('nano')('http://localhost:5984/bookreview');

//sub function hash to encrypt the entered password
function hash(input,salt){
  var hashed = crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
  return ["pbkdf2","10000", salt, hashed.toString('hex')].join('$');
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/signin', function(req, res, next){
  res.render('signin', { title : 'Signin'});
});

router.get('/signup', function(req, res, next){
  res.render('signup', { title : 'Signup'});
});

router.post('/signup', function(req, res, next){
  var name = req.body.name;
  var username = req.body.username;
  var role = req.body.role;
  var password = req.body.password;
  var date = new Date();
  //Create the list of validation error messages
  req.checkBody('username','Email should not be empty').notEmpty();
  req.checkBody('username','Email id should be valid').isEmail();
  req.checkBody('name','Name should not be empty').notEmpty();
  req.checkBody('password','Password should not be empty').notEmpty();
  req.checkBody('password2','Password should match').equals(req.body.password);

  //hash the submitted password
  var salt = crypto.randomBytes(128).toString('hex');
  password = hash(password,salt);
  //then use the hashed password to store in the database
  //Get the validation result
  req.getValidationResult().then(function(result){
      if (! result.isEmpty() ) {
        res.render('signup', {
          errors : result.array(),
          name : name,
          username : username,
          role : role
        });
      } else {
        db.insert({ 
          name : name,
          username : username,
          role : role,
          password : password,
          isDeleted : false,
          createOn : date
        },function(err,body){
          if (err) throw err;
          console.log(body);
        });
        req.flash('success','Registration successfull...Login now');
        res.location('/');
        res.redirect('/');
      }
  });
});

passport.serializeUser(function(body, done){
  done(null,body.rows[0].id);
});

passport.deserializeUser(function(id, done){
  db.get('_design/getUser/_view/view-all?key="' + id + '"',{revs_info:true},function(err,body){
    done(err,body);
  });
});
//DB authentication done here using passport
passport.use(new LocalStrategy(
  function(username, password, done) {
    db.get('_design/getUser/_view/user-view?key="' + username + '"', {revs_info:true} ,function(err,body){
      if (err) console.log(err);
      if (! body){
        console.log('Unknown user');
        return done(null, false, {message : 'Unknown User'});
      }
      //console.log(body.rows[0].value);
      var dbpassword = body.rows[0].value;
      var salt = dbpassword.split('$')[2];
      var hashedpassword = hash(password,salt);
      var isMatch = false;
      if (dbpassword === hashedpassword) isMatch = true;
      if (isMatch) {
        return done(null, body);
      } else {
        console.log('Invalid password');
        return done(null, false, {message : 'Invalid Password'});
      }
    });
  }
));

//Login post method
router.post('/signin', passport.authenticate('local',{failureRedirect:'/users/login',failureFlash:'Login Authentication Failed'}), function(req, res, next){
  console.log('Authentication successfull');
  req.flash('success','Login Successfull');
  res.redirect('/');
});

router.get('/logout', function(req, res, next){
  req.logout();
  req.flash('success','User Logged out');
  res.redirect('/users/signin');
});

module.exports = router;
