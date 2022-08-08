const passport = require('passport');
const localStrategy = require('passport-local');
const bcrypt = require('bcrypt');
var ObjectID = require('mongodb').ObjectID
const GitHubStrategy = require('passport-github')
// require('dotenv').config();

module.exports = function (app, myDataBase) {
    passport.serializeUser((user, done) => { //==6==
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => { // ==7=
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });
// ========== LOCAL STRATEGY =================
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

    // ========= GITHUB STRATEGY =========

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'https://authapp.adityadevelopme.repl.co'
    }, 

    function(accessToken, refreshToken, profile, cb) {
        console.log('MY PROFILE: ', profile);


        myDataBase.findOneAndUpdate( 
            { id: profile.id }, 
            {
                $setOnInsert: {
                    id: profile.id,
                    name: profile.displayName || 'Aditya',
                    photo:  profile.photos[0] || '',
                    email: Array.isArray(profile.emails) ? profile.email[0]: 'No public email',
                    created_on: new Date(),
                    provider: profile.provider || ''
                },
                
                $set : {
                    last_login: new Date()
                },
                $inc: {
                    login_count: 1
                }
            },
            { upsert: true, new: true },
            ( err,doc )=> {
                return cb(null,doc.value)
            } 
            )
            
    }
    ))


}

