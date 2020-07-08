const express = require('express');

const User = require('../models/user');

const authController = require('../controllers/auth');

const { check, body } = require('express-validator/check');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',[
  check('email').isEmail().withMessage('Please enter a valid email Id!') .normalizeEmail()
  .trim(),

  body('password','Please enter password of minimun 5 character!')
    .isLength({min: 5})
    .trim()

], authController.postLogin);

router.post('/signup',
 [
     check('email').isEmail().withMessage('Please enter a valid email Id!')
     .normalizeEmail()
     .trim()
     .custom( ( value, { req } ) => { 
       return User.findOne({email: value})
        .then(userDoc =>{
          if(userDoc){
            return Promise.reject(
                'Email Address already Exist!'
            );
          }
        })  
    }),


    body('password','Please enter password of minimun 5 character!')
    .isLength({min: 5})
    .trim(),


    body('confirmPassword')
    .trim()
    .custom(( value, {req} ) => {
        if(value !== req.body.password) {
            throw new Error('Password not matched!');
        }
        return true;
    })
]
 ,authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;