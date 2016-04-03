var express = require('express');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var app = express.Router();
app.get('/', function(req,res){
	res.render('index');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',passport.authenticate('twitter', {successRedirect : '/profileStats', 
	failureRedirect : '/'}));
module.exports = app;
