var util = require('util');
var express = require('express');
var router = express.Router();
//couch db connection and database call
var db = require('nano')('http://localhost:5984/bookreview');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/signin', function(req, res, next){
  res.render('signin', { title : 'Login'});
});

router.get('/signup', function(req, res, next){
  res.render('signup', { title : 'Sign up'});
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

module.exports = router;
