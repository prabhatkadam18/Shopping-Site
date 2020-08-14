require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: true, 
  cookie: {}
}));

function isAuthenticated(req, res, next){
  if(req.session.user){
    next();
  } else {
    res.redirect('/');
  }
}

app.use('/user', isAuthenticated);

const saltRounds = 5;

mongoose.connect('mongodb://localhost:27017/shoppingDB' , {useNewUrlParser: true, useUnifiedTopology: true} ,(err)=>{
  if(err){
    console.log("Error Connecting to DB");
  }else {
    console.log("DB Connected");
  }
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  dateCreated: Number,
  isVerified: {type: Boolean, default: false},
  isActive: {type: Boolean, default: true},
  passwordResetToken: String,
  resetTokenExpires: Number,
});

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res)=>{
  if(req.session.user){
    return res.redirect("/user");
  } else {
    User.findOne({email: req.body.email.trim().toLowerCase()})
    .catch( err =>{
      console.log(err);
    })
    .then(user=>{
      if(user){
        bcrypt.compare(req.body.password, user.password).then( u=>{
          if(u){
            req.session.user = user;
            return res.redirect('/user');
          } else {
            return res.send("Wrong Password");
          }
        });
      } else {
        return res.send("No User Found");
      }
    });
  }
});

app.get('/register', (req, res)=>{
  if(req.session.user)
    return res.redirect('/user');
  res.render('register');
});

app.post('/register', (req, res)=>{
  User.findOne({email: req.body.email.trim().toLowerCase()})
  .catch(err=>{
    console.log(err);
  })
  .then( user =>{
    if(user){
      return res.send("email taken");
    } else {
      bcrypt.hash(req.body.password, saltRounds).then(hashedPassword=>{
        var newUser = new User({
          email: req.body.email.trim().toLowerCase(),
          password: hashedPassword,
          dateCreated: Date.now(),
        })
        newUser.save();
        req.session.user = newUser;
        return res.send("user registered");
      });
    }
  })
});

app.get('/user', (req, res)=>{
  res.send("User");
})

app.get('/logout', (req, res)=>{
  req.session.destroy();
  res.redirect('/');
});

app.get('*', (req, res)=>{
  res.send(`<div><h3>Page Not Found</h3><br/><a href=${"/"}>Go Back</a>`)
})

app.listen(3000, () => {
  console.log("Server started on 2020");
})