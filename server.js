if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // to load in all of different environment variables and set them inside of process.env
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const initializePassport = require('./passport-config');
initializePassport(
  passport, //
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // simply used to compute the hash. Without the string, access to the session would essentially be "denied".
    resave: false, // resave session if nothing is changed

    saveUninitialized: false, // save an empty value in the session if ther is no value
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, (req, res) => {
  // checkAuthenticated is middle ware to check there is a user or not
  res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true, // show a message
  })
);

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
  console.log(users);
});

app.delete('/logout', (req, res) => {
  req.logOut(); // a part of passport function. Clear a session and log a user out automatically.
  res.redirect('/login');
});

// NOT logged in user can't go to main page. redirect to login instead
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // there is a user
  }

  res.redirect('/login'); // there is NO user
}

// logged in user can't go to login or register
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/'); // there is a user
  }
  next(); // there is a user
}

app.listen(3000);
