const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function(app, db) {
  app.route('/')
    .get(function(req, res) {
      res.sendFile(__dirname + '/views/index.html')
    })

  app.route("/login")
    .post(passport.authenticate("local", {
      failureRedirect: "/"
      }), function(req, res) {
        res.redirect("/board");
    });

  app.route('/board')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(__dirname + '/views/board.html')
    })

    app.route('/room/new')
      .get(ensureAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/newRoom.html')
      })
      .post(ensureAuthenticated, (req, res, next) => {
        var hash = bcrypt.hashSync(req.body.password, 8);

        db.collection('rooms').findOne({ roomName: req.body.roomName }, function(err, room) {
          if(err) {
            next(err);
          }
          else if(room) {
            res.redirect('/board');
          }
          else {
            db.collection('rooms').insertOne(
              {
                roomName: req.body.roomName,
                password: hash,
                roomDescription: req.body.roomDescription
              },
              (err, doc) => {
                if(err) {
                  res.redirect('/board')
                }
                else {
                  next(null, room)
                }
              }
            )
          }
        })
      },
           (req, res, next) => {
          res.redirect('/board');
         }
      )

  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(__dirname + '/views/profile.html')
    })
  app.route('/logout')
    .get((req, res) => {
      req.logout()
      res.redirect('/')
    })

    app.route('/register')
        .post((req, res, next) => {
          var hash = bcrypt.hash(req.body.password, 12)

          db.collection('emails').findOne({ email: req.body.email }, function(err, email) {
            if(err) {
              next(err)
            }
            else if(email) {
              res.redirect('/')
            }
            else {
              db.collection('emails').insertOne(
                {
                  username: req.body.username,
                  email: req.body.email,
                  password: hash
                },
                (err, doc) => {
                  if(err) {
                    res.redirect('/')
                  }
                  else {
                    next(null, email)
                  }
                }
              )
            }
        })
      },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/board');
        }

      )

  app.use((req, res, next) => {
    res.status(404)
    .type('text')
    .send('Not Found')
  })

  function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/');
 };
}
