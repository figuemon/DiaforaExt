var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('about.ejs', { title: 'About Us - Diaforá' });
});
module.exports = router;