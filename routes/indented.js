var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.locals.mode = req.query.mode;
    res.render('indented.ejs', { title: 'Indented Visualization', query: req.query });
});
module.exports = router;