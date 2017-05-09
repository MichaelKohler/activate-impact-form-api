const debug = require('debug')('index');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

//const SheetHelper = require('./lib/sheethelper');

const app = express();

const port = process.env.PORT || 5500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', (req, res) => {
  res.json({success: true});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const server = http.createServer(app);
server.listen(port);
server.on('listening', () => {
  debug('listening on port ' + server.address().port);
});

if (process.env.FETCH_REPS_EVENTS && process.env.FETCH_REPS_EVENTS === 'true') {
  // TODO
}



module.exports = app;
