var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/routes');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twitter = require('twitter');
var client = new Twitter()
var plotly = require('plotly')('porter_robinson', "rx195ocipd");
var moment = require('moment');
var app = express()

passport.use(new TwitterStrategy({
	consumerKey : 'wCqMBOxGOYXOlBTn0oGqvSbaV',
	consumerSecret : 'RBbhUhKDgli1yxH4hWXqnNMoSXbFiPQ3VRyO8bI4f0rRI68adT',
	callbackURL : "http://localhost:3000/auth/twitter/callback"
}, function(token,tokenSecret,profile,done){
	client = new Twitter({
		consumer_key: 'wCqMBOxGOYXOlBTn0oGqvSbaV',
  		consumer_secret: 'RBbhUhKDgli1yxH4hWXqnNMoSXbFiPQ3VRyO8bI4f0rRI68adT',
 		access_token_key: token,
 		access_token_secret: tokenSecret
	})
	done(null,profile);
}));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
app.use('/', routes);
app.listen(process.env.PORT || 3000, function(){
  console.log("gradeCheck: port : %d in %s", this.address().port, app.settings.env);
});
app.get('/profileStats', require('connect-ensure-login').ensureLoggedIn(), function (req,res){
		var parameters = {};
		console.log(req.user)
		parameters["screen_name"] = req.user["username"];
		parameters["include_rts"] = false;
		parameters["count"] = 200;
		var array = [];
		var dateArray = [];
		var toArray = [];
		var favoritesArray = [];
		var retweetedArray = [];
			client.get('statuses/user_timeline',parameters, function(error,tweets,response){
				if(!error){
					for (var prop in tweets){ //each tweet
						var retweetObject = {};
						var favoritesObject = {};
						favoritesObject["favorites"] = tweets[prop]["favorite_count"];
						retweetObject["retweets"] = tweets[prop]["retweet_count"];
						var sentence = tweets[prop].text;
						favoritesObject["favorites_text"] = sentence;
						retweetObject["retweets_text"] = sentence;
						retweetedArray.push(retweetObject);
						favoritesArray.push(favoritesObject);
						var words = sentence.split(" ");
						for (var i in words){
							array.push(words[i])
						}
						if(tweets[prop]['in_reply_to_screen_name'] == req.username){
							toArray.push('Yourself')
						}else{
							toArray.push(tweets[prop]['in_reply_to_screen_name']);
						}
						var c = orderByOccurrence(toArray);
						var d = tweets[prop]["created_at"];
						var e = moment(d).hour()
						dateArray.push(e);
					}	
					var people = c.reverse().slice(0,3);
					favoritesArray.sort(function(a,b){
						if(a.favorites > b.favorites){
							return 1
						} 
						if (a.favorites < b.favorites){
							return -1
						}
							return 0;
					});
					retweetedArray.sort(function(a,b){
						if(a.retweets > b.retweets){
							return 1;
						}
						if(a.retweets < b.retweets){
							return -1;
						}
						return 0;
					});
					var retweetsFinal = retweetedArray.reverse();
					var favoritesFinal = favoritesArray.reverse();
					console.log(retweetsFinal);
					console.log(favoritesFinal);
					var a = {}
					for (obj in dateArray){
						a[dateArray[obj]] = (a[dateArray[obj]] || 0) + 1;
					}
					var x = [];
					var y = [];
					for (var k in a){
						x.push(k);
						y.push(a[k]);

					}
					var data = [{
						x: x,
						y: y,
						type : "scatter"
					}]
					var layout = {
						title : "When You Tweet",
						xaxis : {
							title : "Hour in the Day",
							titlefont: {
								family : "Roboto",
								color : "#00aced"
							}
						},
						yaxis : {
							title : "Number of Tweets",
							titlefont : {
								family : "Roboto",
								color : "#00aced"
							}
						}
					}
					var graphOptions = {layout : layout,fileName : "TwitterStatHistogram", fileopt:"overwrite"}
					plotly.plot(data, graphOptions, function (err, msg) {
						if(!err){
    						console.log(msg.url);
    						var la = msg.url +".embed"
    						var a = orderByOccurrence(array);
							var t = a.reverse()
							t = t.slice(0,10);
							res.render('stat',{data : t, url : la, topthree : people, favorites : favoritesFinal, retweets : retweetsFinal})
    					}else{
    						console.log(err)
    						var a = orderByOccurrence(array);
							var t = a.reverse()
							t = t.slice(0,10);
							res.render('stat',{data : t, url : la, topthree : people, favorites: favoritesFinal, retweets: retweetsFinal})

    					}	
					});
					
				}
			})
		
})

function orderByOccurrence(arr) {
    var counts = {};
    arr.forEach(function(value){
        if(!counts[value]) {
            counts[value] = 0;
        }
        counts[value]++;
    });

    var arra = Object.keys(counts).sort(function(curKey,nextKey) {
        return counts[curKey] < counts[nextKey];
    });
    var c = [];
    for (objects in arra) {
    	var b = {};
    	if(typeof(arra[objects])==null){
    		b["word"] = "Nobody";
    	}else{
    		b["word"] = arra[objects];
    	}
    	b["occurrences"] = counts[arra[objects]];
    	c.push(b);
 	    }
    c.sort(function(a,b){
    	if (a.occurrences > b.occurrences) {
    return 1;
  	}
  if (a.occurrences < b.occurrences) {
    return -1;
  }
  // a must be equal to the second
  return 0;
    })
    return c;

}

module.exports = app;
