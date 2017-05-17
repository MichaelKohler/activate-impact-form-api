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
    const groupedByEvents = responses.map((response) => {
      const eventResponse = ResponseParser.getGeneralEventInfo(response);
      eventResponse.nps = response[3];
      return eventResponse;
    })
    .reduce((acc, response) => {
      const npsScoreCopy = JSON.parse(JSON.stringify(response.nps));

      acc[response.key] = acc[response.key] || response;

      if (!acc[response.key].scores) {
        delete acc[response.key].nps;
      }

      acc[response.key].scores = acc[response.key].scores || [];
      acc[response.key].scores.push(npsScoreCopy);
      return acc;
    }, {});

    return Object.keys(groupedByEvents).map((key) => { return groupedByEvents[key]; });
  }

  static getGeneralEventInfo(response) {
    return {
      key: response[1] + '_' + response[2],
      eventName: response[0],
      eventDate: response[2],
      organizerName: response[1],
      organizerUrl: remoUserHelper.getRepUrlByFullName(response[1])
    };
  }
}
