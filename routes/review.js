var express = require('express');
var router = express.Router();
//couch db connection and database call
var db = require('nano')('http://localhost:5984/bookreview');

router.get('/show/:_title', function(req, res, next){
    if (req.user){
        console.log(req.user.rows[0].id);
        db.get('_design/getDocs/_view/getAllDocs?key="' + req.params._title + '"',{ revs_info: true}, function(err, body){
            if (err) console.log(err);
            //console.log(body.rows);
            res.render('review', {
                title : 'Online Book Reviewer',
                user : req.user,
                review : body.rows,
                comments : body.rows[0].value.comments
            });
        });    
    }
});

router.get('/addReview',function(req, res, next){
    res.render('addReview', { title : 'Online Book Reviewer'});
});

router.post('/addReview', function(req, res, next){
    var title = req.body.title;
    var content = req.body.contents;
    var date = new Date();
    var creator = req.user.rows[0].value;

    req.checkBody('title','Title should not be empty').notEmpty();
    req.checkBody('contents','Contents should not be empty').notEmpty();
    req.getValidationResult().then(function(result){
        if(! result.isEmpty()){
            res.render('addReview',{
                errors : result.array(),
                user : req.user,
                title : title,
                contents : content
            });
        } else {
            db.insert({
                type : 'review',
                title : title,
                content : content,
                createdOn : date,
                isDeleted : false,
                createdBy : creator
            }, function(err, body){
                if (err) console.log(err);
                console.log(body);
            });
            req.flash('success','New Review created successfully');
            res.location('/');
            res.redirect('/');
        }
    });
});

router.post('/addComment', function(req, res, next){
    var title = req.body.title;
    var comment = req.body.comment;
    var thisReview = JSON.parse(req.body.reviewJson);
    //console.log(thisReview);
    var reviewId = thisReview[0].id;
    var reviewTitle = thisReview[0].key;
    var reviewRev = thisReview[0].value._rev;
    var reviewContent = thisReview[0].value.content;
    var reviewCreator = thisReview[0].value.creator;
    var reviewisDeleted = thisReview[0].value.isDeleted;
    var reviewCreatedOn = thisReview[0].value.createdOn;
    var commentDate = new Date();
    var commentCreator = req.user.rows[0].value;
    var commentsAvl = (thisReview[0].value.comments) ? thisReview[0].value.comments : [];
    //console.log(commentsAvl);
    //Get the validation results
    req.checkBody('title', "Title should not be left empty").notEmpty();
    req.checkBody('comment',"Comment should be left empty").notEmpty();
    req.getValidationResult().then(function(result){
        if (! result.isEmpty() ){
            db.get('_design/getDocs/_view/getAllDocs?key="' + reviewTitle + '"',{revs_info:true},function(err,body){
                if (err) console.loe(err);
                res.render('review',{
                    errors : result.array(),
                    user : req.user,
                    title : title,
                    comment : comment,
                    review : body.rows,
                    comments : body.rows[0].value.comments
                });
            });
        } else {
            if (title && comment) {
                //var obj = JSON.parse(commentsAvl);
                commentsAvl.push({
                    'title' : title,
                    'comment' : comment,
                    'commentBy' : commentCreator,
                    'commentedOn' : commentDate
                });
                //commentsAvl = JSON.stringify(obj);
            }
            //console.log(commentsAvl);
            //insert the new comment and insert the whole document again
            //using the revision id
            //this is the procedure available with the couch db for doc updates
            db.get('_design/getDocs/_view/getAllDocs?key="' + reviewTitle + '"', function(err,body){
                if (err) console.log(err);
                console.log(body);
                //console.log(body.rows[0].value._rev);
                db.insert({
                    _rev : body.rows[0].value._rev,
                    type : 'review',
                    title : reviewTitle,
                    content : reviewContent,
                    createdOn : reviewCreatedOn,
                    comments : commentsAvl,
                    isDeleted : reviewisDeleted,
                    createdBy : reviewCreator
                },body.rows[0].id,function(err,body){
                    if (err) throw err;
                    console.log(body);
                    req.flash('success','Comment Added successfully');
                    res.location('back');
                    res.redirect('back');
                });
            });
        }
    });
//console.log(req.user);
});

module.exports = router;