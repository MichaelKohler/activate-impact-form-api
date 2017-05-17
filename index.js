const debug = require('debug')('index');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const SheetHelper = require('./lib/sheetHelper');
const sheetHelper = new SheetHelper();

const ResponseParser = require('./lib/responseParser');

const app = express();

const port = process.env.PORT || 5500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', (req, res) => {
  sheetHelper.fetch()
    .then((result) => {
      return ResponseParser.create(result);
    })
    .then((responses) => {
      res.json(responses);
    })
    .catch((err) => {
      debug('FAILED_TO_FETCH_RESPONSES', err);
      res.status(500);
      res.json({ error: { message: err.message }});
    });
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
  const error = {
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  };

  res.status(error.error.status || 500);
  res.json(error);
});

const server = http.createServer(app);
server.listen(port);
server.on('listening', () => {
  debug('listening on port ' + server.address().port);
});

if (process.env.FETCH_REPS_EVENTS && process.env.FETCH_REPS_EVENTS === 'true') {
  // TODO
}

sheetHelper.init();

module.exports = app;
