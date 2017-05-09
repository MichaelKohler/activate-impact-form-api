'use strict';

const debug = require('debug')('sheethelper');
const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const config = require('../config.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_DIR = '.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.json';

module.exports = class SheetHelper {
  init() {
    debug('Authorizing..');
    return this.authorize()
      .catch((err) => {
        debug('Authorization failed', err);
        return new Error('AUTHORIZATION_FAILED');
      });
  }

  authorize() {
    return this.loadToken()
      .then(this.authorizeRemote)
      .then(this.storeToken)
      .then((oauth2Client) => {
        this.oauth2Client = oauth2Client;
        return this.fetch();
      });
  }

  loadToken() {
    return new Promise((resolve, reject) => {
      fs.readFile('client_secret.json', (err, content) => {
        if (err) {
          debug('Error loading client secret file: ' + err);
          return reject(new Error('LOADING_CLIENT_SECRET_FAILED'));
        }

        return resolve(JSON.parse(content));
      });
    });
  }

  authorizeRemote(credentials) {
    return new Promise((resolve, reject) => {
      const clientSecret = credentials.installed.client_secret;
      const clientId = credentials.installed.client_id;
      const redirectUrl = credentials.installed.redirect_uris[0];
      const auth = new googleAuth();
      const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
          });

          debug('Authorize this app by visiting this url: ', authUrl);

          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
              if (err) {
                debug('Error while trying to retrieve access token', err);
                return;
              }

              oauth2Client.credentials = token;
              resolve(oauth2Client);
            });
          });
        } else {
          oauth2Client.credentials = JSON.parse(token);
          resolve(oauth2Client);
        }
      });
    })
  }

  storeToken(oauth2Client) {
    const token = oauth2Client.credentials;

    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }

      fs.writeFile(TOKEN_PATH, JSON.stringify(token));
      debug('Token stored to ' + TOKEN_PATH);
      resolve(oauth2Client);
    });
  }

  fetch() {
    return new Promise((resolve, reject) => {
      const sheets = google.sheets('v4');
      sheets.spreadsheets.values.get({
        auth: this.oauth2Client,
        spreadsheetId: config.sheetId,
        range: config.range,
      }, (err, response) => {
        if (err) {
          debug('The API returned an error: ' + err);
          return reject(new Error('API_ERROR'));
        }

        const rows = response.values;
        if (rows.length == 0) {
          debug('No data found.');
        } else {
          console.log(rows);
        }
      });
    });
  }
}
