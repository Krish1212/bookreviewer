var express = require('express');
var router = express.Router();
//couch db connection and database call
var db = require('nano')('http://localhost:5984/bookreview');

/* GET home page. */
router.get('/', function(req, res, next) {
  //check if the user is logged in
  if (req.user) {
    //if yes, get all the reviews
    db.get('_design/getDocs/_view/getAllDocs', {revs_info:true} ,function(err,body){
      if (err) console.log(err);
      res.render('index',{
        title : 'Online Book Reviewer',
        user : req.user,
        reviews : body.rows
      });
    });
    //send the reviews to the index page
    //along with the user
  } else {
    res.render('index', { title: 'Online Book Reviewer' });    
  }
});



module.exports = router;
