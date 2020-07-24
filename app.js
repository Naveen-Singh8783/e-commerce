var PORT = process.env.PORT ||  3000;


const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');


const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const store = new MongoDBStore({
  uri: 'mongodb+srv://NaveenSingh:nick1997@cluster0-d01o9.mongodb.net/shop',
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStroage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'images')
  },

  filename: (req, file, cb) =>{ 
    cb(null, Date.now() +'-'+ file.originalname);
  }
});


const fileFilter = (req, file, cb) => {
 if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
   cb( null, true);
 }else{
   cb(null, false);
 }
}


app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { error } = require('console');

app.use(bodyParser.urlencoded({ extended: false }));

//Init file upload
app.use(multer({storage: fileStroage, fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use(( req, res, next) =>{
  res.locals.isAuthenticated = req.session.isLoggedIn,
  res.locals.csrfToken = req.csrfToken(),
  next()
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next(); 
    })
    .catch(err => {
      return next(new Error(err));
    });
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

 app.use((error, req, res, next) => {
  res.render('500', {
    pageTitle: 'Error!',
    path: '/500'
    
  });
})  

mongoose
  .connect(
'mongodb+srv://NaveenSingh:nick1997@cluster0-d01o9.mongodb.net/shop?retryWrites=true&w=majority'
)
  .then(result => {
    app.listen(PORT);
  })
  .catch(err => {
    console.log(err);
  });
