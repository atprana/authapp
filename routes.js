const passport = require('passport');
const bcrypt = require('bcrypt');
module.exports = function (app, myDataBase) {

    app.route('/').get((req, res) => {
        //Change the response to render the Pug template
        res.render('pug', {
            title: 'Connected to Database',
            message: 'Please login',
            showLogin: true,
            showRegistration: true,
            showSocialAuth: true
        });
    });


    app.post('/login', passport.authenticate('local', { failureRedirect: '/', failureMessage: 'Login failed' }), (req, res, user) => {
        res.redirect("/profile")
    });

    app.get('/profile', ensureAuthenticated, (req, res) => {
        res.render('pug/profile', { username: req.user.username })
    });

    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });


    app.route('/register').post((req, res, next) => {
        console.log(req.body.password)
        const hash = bcrypt.hashSync(req.body.password,12) // HASH the password
        console.log(hash);
        myDataBase.findOne({ username: req.body.username }, (err, user) => {
            if (err) {
                next(err);
            } else if (user) {
                res.redirect('/');
            } else {
                myDataBase.insertOne({
                    username: req.body.username,
                    password: hash// password: req.body.password 
                }, (err, doc) => {
                    if (err) {
                        res.redirect('/');
                    } else {
                        console.log(doc.ops[0])
                        next(null, doc.ops[0]);
                    }
                })
            }
        })
        
    },
 
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/profile');
        }
    );

    app.route('/auth/github').get(passport.authenticate('github'))

    app.route('/auth/github/callback').get(passport.authenticate('github', 
    {failureRedirect: '/'}, (req, res) => res.redirect('/profile')));



    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found')
    })

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/')
    }
    // Serialization and deserialization here...

}