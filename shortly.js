var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('node-uuid');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var checkUser = require('./app/checkUser');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());


// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(checkSession);
app.use(express.static(__dirname + '/public'));

app.use(session({
  genid: function(req) {
    return uuid.v4(); // use UUIDs for session IDs
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/login',
  function(req, res) {
    res.render('login');
});

app.get('/signup',
function(req, res) {
    res.render('signup');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.redirect('/index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login',
function(req, res) {
  //get the user name and password from the req
  var username = req.body.username;
  var password = req.body.password;

  //check if the username exists
  new User({username: username}).fetch().then(function(user) {
    if (!user) {
      console.log('The user does not exist. The user needs to sign up.');
      return res.redirect('/login');
    }
    // if user exists, compare the hash with the hash in the database
    user.comparePasswords(password, function(error, match) {
      if (match) {
        console.log("Logged in successfully as: ", username);
        util.createSession(req, res, user);
        res.redirect('/');
      } else if (error) {
        console.log("There was an error ", error);
      } else {
        console.log('Your password did not match. Try again.');
        res.redirect('/login');
      }
    });
  });
});

app.post('/signup',
function(req, res) {
  //get the user name and password from the req
  var username = req.body.username;
  var password = req.body.password;

  //check if the username is in the database
  new User({username: username}).fetch().then(function(user) {
    if (user) {
      console.log('The account with username ', username, ' already exists.');
      res.redirect('/signup');
    } else {
      //add to the users database with the user info
      console.log("creating new user: ", username);
      Users.create({
        username: username,
        password: password // password is update upon instantiation of model -- see user model
      }).then(function(newUser) {
        //set the session
        util.createSession(req, res, newUser);
      });
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
