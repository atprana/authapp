const passport = require('passport');
const localStrategy = require('passport-local');
const bcrypt = require('bcrypt');
var ObjectID = require('mongodb').ObjectID


module.exports = function (app, myDataBase) {
    passport.serializeUser((user, done) => { //==6==
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => { // ==7=
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });

    passport.use(new localStrategy(
        function (username, password, done) {
            myDataBase.findOne({ username: username }, function (err, user) {
                console.log('User ' + username + ' attempted to log in');
                if (err) {
                    console.log('ERROR 1: ', err)
                    return done(err)
                };
                if (!user) {
                    console.log('ERROR 2: ', err)
                    return done(null, false)
                };
                // if (password !== user.password) -- now we use hash password, so
                if (!bcrypt.compareSync(password, user.password)) {
                    console.log('ERROR 3: ', err)

                    return done(null, false);
                }
                return done(null, user);
            })
        }
    ))



}

