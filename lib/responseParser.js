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
    }).reduce(groupByEvent, {});

    const events = convertObjectToArray(groupedByEvents);
    const scoredEvents = scoreEvents(events);
    return scoredEvents;
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

function groupByEvent(acc, response) {
  const npsScoreCopy = JSON.parse(JSON.stringify(response.nps));

  acc[response.key] = acc[response.key] || response;

  if (!acc[response.key].scores) {
    delete acc[response.key].nps;
  }

  acc[response.key].scores = acc[response.key].scores || [];
  acc[response.key].scores.push(parseInt(npsScoreCopy, 10));
  return acc;
}

function convertObjectToArray(object) {
  return Object.keys(object).map((key) => {
    return object[key];
  });
}

function scoreEvents(events) {
  return events.map((event) => {
    event.nps = calculateNPS(event.scores);
    delete event.scores;
    return event;
  });
}

function calculateNPS(scores) {
  const numberOfScores = scores.length;
  let promoters = 0;
  let detractors = 0;

  for (let score of scores) {
    if (score >= 7) {
      promoters++;
    } else if (score <= 4) {
      detractors++;
    }
  }

  const promoterRatio = promoters / numberOfScores;
  const detractorRatio = detractors / numberOfScores;

  const nps = Math.round((promoterRatio - detractorRatio) * 100);
  return nps;
}