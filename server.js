'use strict';
require('dotenv').config();

const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
var session = require('express-session');
var passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({url: URI});


// const { render } = require('pug');
// const mongodb = require('mongodb');


app.set('view engine', 'pug');

const { Session } = require('inspector');
const { IO_SEEK_CUR } = require('mongodb/lib/gridfs/grid_store.js');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store:store
}))

app.use(passport.initialize());
app.use(passport.session());

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
  );


myDB(async client => {
  const myDataBase = await client.db('advancenodeexpress').collection('users');

  routes(app, myDataBase);
  auth(app, myDataBase)
  
  // --------------------- User connect 
  
  let currentUsers = 0;
  io.on('connection', socket => {
    ++currentUsers;
    // io.emit('user count', currentUsers);
    io.emit('user', {
      name: socket.request.user.username,
      currentUsers,
      connected: true
    });
    // console.log('A user has connected');
    console.log('user ' + socket.request.user.username + ' connected');

    socket.on('chat message', (message) => {
      io.emit('chat message',
      {
        name: socket.request.user.username,
        message: message
      })
    }) 
    // -------------- listen on disconnect 
    socket.on('disconnect', () => {
      --currentUsers;
      // io.emit('user count', currentUsers)
      io.emit('user', {
        name: socket.request.user.username,
        currentUsers,
        connected: false
      });
      console.log('A user has disconnected')
    })
  })

  // Be sure to add this... 
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;

  function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');
  
    accept(null, true);
  }
  
  function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
  }
  
  http.listen(PORT, () => {
  let currentUsers = 0;
  console.log('Listening on port ' + PORT);

});
