'use strict';
require('dotenv').config();

const routes = require('./routes.js');

var passport = require('passport');
const express = require('express');
const { render } = require('pug');
const mongodb = require('mongodb');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
var session = require('express-session'); // ==3==
// ==4==
const auth = require('./auth');

const app = express();
app.set('view engine', 'pug'); // =1=

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
  const myDataBase = await client.db('advancenodeexpress').collection('users');
  routes(app, myDataBase);
  // Be sure to change the title
  auth(app, myDataBase)

  // Be sure to add this... 
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
