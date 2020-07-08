const crypto = require('crypto');

const { validationResult } = require('express-validator/check');

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: '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'
    }
  })
);

exports.getLogin = (req, res, next) => {
  let msg = req.flash('error');
  if(msg.length > 0){
    msg = msg[0];
  }else{
    msg = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMassge: msg,
    oldInput: {
      email: '',
      password: ''
    },
    validationError: []
    
  });
};

exports.getSignup = (req, res, next) => {
  let msg = req.flash('error');
  if(msg.length > 0){
    msg = msg[0];
  }else{
    msg = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMassge: msg,
    oldInput: {
      email: '',
      password: '',
      confirmpaasword: ''
    },
    validationError: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const error = validationResult(req);
  console.log(error);
  if(!error.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMassge: error.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationError: error.array()
    });
  };

  User.findOne({email: email})
    .then(user => {
      if(!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMassge: 'No user exist with this E-mail Id!',
          oldInput: {
            email: email,
            password: password
          },
          validationError: [{ param: 'email'}]
        });
      }

      bcrypt.compare(password, user.password)
      .then(doMatch =>{
        if(doMatch){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            res.redirect('/');
          });
        }
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMassge: 'Invaild Password!',
          oldInput: {
            email: email,
            password: password
          },
          validationError: [{param: 'password'}]
        });
      })
      .catch(err => {
        console.log(err);
        return res.redirect('/login');
      })
   
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const error = validationResult(req);
  console.log("all error are:")
  console.log(error);
  if(!error.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMassge: error.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationError: error.array()
    });
  };

 
   bcrypt.hash( password, 12)
   .then(hashPassword =>{
    const user = new User({
      email: email,
      password: hashPassword,
      cart: {items: []}
    });
    return user.save()
  })
  .then(result =>{
    res.redirect('/login');
    return transporter.sendMail({
      to: email,
      from: 'n.sneekumbh7722@gmail.com',
      subject: 'Signup Sucessfull!',
      html : '<h1>You succesfully signed up!</h1>'
    });
  });
  
  

};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let msg = req.flash('error');
  if(msg.length > 0){
    msg = msg[0];
  }else{
    msg = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMassge: msg
  });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
      if(err){
        console.log(err);
        return res.redirect('/reset');
      }
      const token = buffer.toString('hex');
      User.findOne({email: req.body.email})
      .then(user => {
        if(!user){
          req.flash('error', 'No User is found with this email address!');
          res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'n.sneekumbh7722@gmail.com',
          subject: 'Reset Password!',
          html : `
                <p>You requested for password change</p>
                <p>click this  <a href="http://localhost:3000/reset/${token}">link</a> to reset.</p> 
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
        
      });
    });
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
    let msg = req.flash('error');
    if(msg.length > 0){
      msg = msg[0];
    }else{
      msg = null;
    }
    res.render('auth/new-password', {
      path: '/New-password',
      pageTitle: 'New Password',
      errorMassge: msg,
      userId: user._id.toString(),
      passowrdToken : token
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
    
  });

}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passowrdToken = req.body.passowrdToken;
    let resetUser;

    User.findOne({resetToken: passowrdToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId })
    .then(user =>{
        resetUser = user;
        return bcrypt.hash(newPassword, 12)
    })
    .then(HashnewPassword =>{
      resetUser.password = HashnewPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;

      return resetUser.save()
    })
    .then(result =>{
      res.redirect('/login')
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
    
}
