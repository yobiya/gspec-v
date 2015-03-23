var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var multer = require('multer');

// MongoDBへの接続
var mongoose = (function() {
  var mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/gspecv');
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('Connect to mongodb.');
  });

  return mongoose;
})();

var mongoModels = require('./models/mongo_model')(mongoose);

var constants = require('./models/constants.js');
var main_page = require('./routes/main_page').setup(mongoModels);
var login = require('./routes/login').setup(mongoModels);

var express = require('express');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: 'secret_value', ///< @todo 環境変数から読み込む
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    db: 'gspecv',
    host: 'localhost',
    clear_interval: 60 * 60 * 24 * 7  // 1週間保存
  }),
  cookie: {
    httpOnly: false,
    maxAge: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000)
  }
}));

// アップロードされたファイルの保存先を設定
app.use(multer({ dest: constants.FILE_UPLOAD_DIRECTORY }));

app.use('/', main_page);
app.use('/login', login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
