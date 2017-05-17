'use strict';

const debug = require('debug')('ResponseParser');
const RemoUserHelper = require('../lib/remoUserHelper');
const remoUserHelper = new RemoUserHelper();

module.exports = class ResponseParser {
  /**
   * Creates an object from the response to make sure we assign to real properties
   * @param  {Array} responses responses from the form
   * @return {Array}           descriptive responses as objects
   */
  static create(responses) {
    debug('Creating responses..');
    return responses.map((response) => {
      return {
        eventName: response[0],
        eventDate: response[2],
        organizerName: response[1],
        nps: response[3],
        organizerUrl: remoUserHelper.getRepUrlByFullName(response[1])
      };
    });
  }
}
