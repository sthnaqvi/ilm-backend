/**
 * Created by Tauseef Naqvi on 27-02-2017.
 */
// BASE SETUP
// =============================================================================
// import the packages we need
var express = require('express');                   //import express module
var bodyParser = require('body-parser');            //import bodyparser
var mongoose = require('mongoose');                 //import mongoose
var multer = require('multer');                     //import multer
var fsExtra = require('fs-extra');                  //import fs-extra
var path = require('path');                         //import path
var fileSystem = require('fs');                     //import fileSystem
var cors = require('cors');                         //import cors for cross domain request
var app = express();                                //import express contractor
var Ebook = require('./app/models/ebook'); //import Ebook model
var config = require('./config'); //import config

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// configure cors
app.use(cors());

// connect to our database
mongoose.connect(config.database, function (err) {
    if (err)
        console.log(err);
    console.log('database connected at :- ' + config.database);
});
//create db for mongoDB native operations
var db = mongoose.connection.db;

// create upload to use for file destination folder and name
var folderPath = process.env.uploadPath || './uploads';
var storage = multer.diskStorage({
    destination: function (req, files, cb) {
        var filePath = folderPath + '/ebooks/' + files.fieldname;
        fsExtra.mkdirsSync(filePath);
        cb(null, filePath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
var upload = multer({storage: storage});

// ROUTES FOR OUR API
// =============================================================================
// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function (req, res, next) {
    // do logging
    console.log('Something is happening.');
    next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});

// on routes that end in /ebooks
// ----------------------------------------------------
router.route('/ebooks')

// get all/search/tag Keywords related ebooks (accessed at GET http://localhost:8080/api/ebooks?search=&tag=&skip=)
    .get(function (req, res) {
        var skip = Number(req.query.skip);
        var search_key = req.query.search;
        if (req.query.tag)
            var tag_key = req.query.tag.split(',');
        var query = {};
        if (search_key)
            query.$text = {$search: search_key};
        if (tag_key)
            query.tag = {$in: tag_key}; //if using $in get all ebooks of related tag
        //if using $all get only ebooks has related tag
        console.log(query);
        Ebook.find(query, function (err, ebooks) {
            if (err)
                return res.status(500).json(err);
            res.json(ebooks);
        }).skip(skip).limit(10);
        console.log(skip);
    });

// on routes that end in /ebooks/downloads
// ----------------------------------------------------
router.route('/ebooks/downloads')

// get all/search/tag Keywords related ebooks (accessed at GET http://localhost:8080/api/ebooks/downloads?ebook_id=&download=)
    .get(function (req, res) {
        Ebook.findById(req.query.ebook_id, function (err, ebook) {
            if (err)
                res.send(err);
            if (req.query.download == 'cover')
                var resPath = ebook.cover_path, fileType = 'image/jpeg';
            if (req.query.download == 'pdf')
                var resPath = ebook.path, fileType = 'application/pdf';
            else
                var resPath = ebook.cover_path, fileType = 'image/jpeg';
            var filePath = path.join(resPath);
            var stat = fileSystem.statSync(filePath);
            res.writeHead(200, {
                'Content-Type': fileType,
                'Content-Length': stat.size,
            });
            var readStream = fileSystem.createReadStream(filePath);
            // We replaced all the event handlers with a simple import to readStream.pipe()
            readStream.pipe(res);
        });
    });

// on routes that end in /ebooks/uploads
// ----------------------------------------------------
router.route('/ebooks/uploads')

// create a ebook (accessed at POST http://localhost:8080/api/ebooks/uploads)
    .post(upload.fields([{name: 'pdf'}]), function (req, res) {
        console.log(req.body);
        console.log(req.files);
        var ebook = new Ebook();                               // create a new instance of the Ebook model
        ebook.cover_path = req.body.cover;
        ebook.title = req.body.title;                          // set the ebooks title (comes from the request)
        ebook.description = req.body.description;              //set the ebooks description (comes from the request)
        ebook.tag = req.body.tag.split(',');                   //set the ebooks tag (comes from the request)
        ebook.path = path.resolve(req.files.pdf[0].path);
        // ebook.cover_path = path.resolve(req.files.cover[0].path);
        ebook.save(function (err) {
            if (err)
                res.send(err);
            res.json({message: ebook.title + " is store in Database with Id: " + ebook.id});
        });
    });

// on routes that end in /ebooks/getCategories
// ----------------------------------------------------
router.route('/ebooks/getCategories')
// get all Keywords in ebooks Tag (accessed at GET http://localhost:8080/api/ebooks/getCategories)
    .get(function (req, res) {
        db.collection('ebooks').distinct("tag", function (err, Categories) {
            if (err)
                return res.status(500).json(err);
            res.json(Categories);
        });
    });
// on routes that end in /ebooks/:ebook_id
// ----------------------------------------------------
router.route('/ebooks/:ebook_id')

// get the ebook with that id
    .get(function (req, res) {
        Ebook.findById(req.params.ebook_id, function (err, ebook) {
            if (err)
                res.send(err);
            res.json(ebook);
        });
        console.log(req.params.ebook_id);
    })

    // update the ebook with this id
    .put(upload.fields([{name: 'pdf'}, {name: 'cover'}]), function (req, res) {
        Ebook.findById(req.params.ebook_id, function (err, ebook) {
            if (err)
                res.send(err);
            ebook.title = req.body.title;
            ebook.description = req.body.description;
            ebook.tag = req.body.tag.split(',');
            ebook.path = path.resolve(req.files.pdf[0].path);
            ebook.cover_path = path.resolve(req.files.cover[0].path);
            ebook.save(function (err) {
                if (err)
                    res.send(err);
                res.json({message: ebook.title + " is updated!"});
            });
        });
    })

    // delete the ebook with this id
    .delete(function (req, res) {
        Ebook.remove({
            _id: req.params.ebook_id
        }, function (err, ebook) {
            if (err)
                res.send(err);
            res.json({message: 'Successfully deleted'});
        });
    });

// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(config.port, function (err) {
    if (err)
        console.log(err);
    console.log('server running at  ' + config.port);
});