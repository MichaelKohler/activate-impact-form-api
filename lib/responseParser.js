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
    const fullEventResponses = responses.map((response) => {
      const eventResponse = ResponseParser.getGeneralEventInfo(response);

      if (eventResponse) {
        eventResponse.nps = response[3];
        eventResponse.profession = response[4];
      }

      return eventResponse;
    })
    .filter((response) => { return response; })

    const eventResponses = fullEventResponses.map(sanitizeResponse)
      .reduce(groupByEvent, {});

    const events = convertObjectToArray(eventResponses);
    const allScores = events.reduce((acc, value) => {
      return acc.concat(value.scores);
    }, []);
    const scoredEvents = scoreEvents(events);
    const totals = {
      totalResponses: fullEventResponses.length,
      totalEvents: scoredEvents.length,
      overallNPS: calculateNPS(allScores),
      typeOfEvents: getTypeSummary(events)
    };

    return {
      totals,
      events: scoredEvents
    };
  }

  static getGeneralEventInfo(response) {
    if (!response[1]) {
      return;
    }

    return {
      key: response[1] + '_' + response[2],
      eventName: response[0],
      eventDate: response[2],
      organizerName: response[1],
      organizerUrl: remoUserHelper.getRepUrlByFullName(response[1])
    };
  }
}

function sanitizeResponse(response) {
  if (!response.profession) {
    response.profession = '';
  }

  return response;
}

function groupByEvent(acc, response) {
  // TODO: make this more readable with separate functions and a different
  // function name as this is not only grouping..
  const npsScoreCopy = JSON.parse(JSON.stringify(response.nps));

  acc[response.key] = acc[response.key] || response;

  if (!acc[response.key].scores) {
    delete acc[response.key].nps;
  }

  acc[response.key].scores = acc[response.key].scores || [];
  acc[response.key].scores.push(parseInt(npsScoreCopy, 10));

  const professionCopy = JSON.parse(JSON.stringify(response.profession));
  if (!acc[response.key].professions) {
    delete acc[response.key].profession;
  }

  acc[response.key].professions = acc[response.key].professions || {};
  const professions = acc[response.key].professions;
  if (professions[professionCopy] !== undefined) {
    professions[professionCopy] += 1;
  } else {
    professions[professionCopy] = 1;
  }

  acc[response.key].numberOfResponses = acc[response.key].numberOfResponses || 0;
  acc[response.key].numberOfResponses++;

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

function getTypeSummary(responses) {
  return responses.reduce((acc, response) => {
    if (acc[response.eventName] !== undefined) {
      acc[response.eventName] += 1;
    } else {
      acc[response.eventName] = 1;
    }

    return acc;
  }, {});
}
