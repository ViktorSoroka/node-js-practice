var express = require('express');
var router = express.Router();
var db = require('../fake-db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    db.getCollection(function (err, db) {
        res.json(db);
    });
});

router.get('/:id', function (req, res, next) {
    db.getById(req.params.id, function (err, model) {
        res.json(model);
    });
});

router.post('/', function (req, res, next) {
    db.create(req.body, function (err, model) {
        res.json(model);
    });
});

router.delete('/:id', function (req, res, next) {
    db.remove(req.params.id, function (err) {
        res.json(db);
    });
});

router.put('/:id', function (req, res, next) {
    db.update(req.body, function (err, model) {
        res.json(model);
    });
});

module.exports = router;
