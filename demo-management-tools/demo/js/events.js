/* Copyright (C) 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agree to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



var utilities = utilities || {};
var events = events || {};


/**
 * Updates the list of available events.
 *
 * @param {?string} pageToken The next page token from the previous API call.
 * TODO (class) Move HTML generation into helper / Polymer component.
 */
events.updateEventsList = function(pageToken) {
  console.log('Update Events List');
  gapi.client.games.events.listDefinitions({maxResults: 10, pageToken: pageToken
  }).execute(
      function(response) {
        var root = document.getElementById('eventsBox');
        root.innerHTML = '';
        events.createEventsList(root, response.items);

        if (response.prevPageToken) {
          root.appendChild(
              utilities.createButton('Prev', response.prevPageToken,
                  function(event) {
                    events.updateEventsList(event.target.value);
                  }));
        }
        if (response.nextPageToken) {
          root.appendChild(
              utilities.createButton('Next', response.nextPageToken,
                  function(event) {
                    events.updateEventsList(event.target.value);
                  }));
        }
      }
  );
};


/**
 * Creates list of Events.
 *
 * @param {Object} root the element you want to append this to.
 * @param {Array} items the list of achievements
 */
events.createEventsList = function(root, items) {
  console.log('Show events');
  var tab = document.createElement('table');
  tab.className = 'gridtable';
  var row, cell;

  // Make the header
  row = document.createElement('tr');
  row.style.backgroundColor = colors.accent3;
  cell = utilities.createCell('th', 'Name', undefined, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'ID', undefined, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'Visibility', undefined, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'Count', undefined, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'Increment', undefined, '#FFF');
  row.appendChild(cell);

  tab.appendChild(row);

  // Now actually parse the data.
  for (var index in items) {
    item = items[index];
    row = document.createElement('tr');
    row.style.backgroundColor = index & 1 ? '#CCC' : '#FFF';

    cell = utilities.createCell('td', item.displayName);
    row.appendChild(cell);

    var input = utilities.createTextInput(42, item.id, true);
    cell = utilities.createCell('td', undefined, undefined, undefined,
        undefined, input);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.visibility);
    row.appendChild(cell);

    cell = utilities.createCell('td');
    cell.id = item.id;
    row.appendChild(cell);

    cell = utilities.createCell('td');
    cell.appendChild(
        utilities.createButton('trigger', item.id,
            function(event) {
              events.incrementEvent(event.target.value);
            }));
    cell.appendChild(
        utilities.createButton('pick', item.id,
            function() {
              events.setCurrentEventId(event.target.value);
            }));
    row.appendChild(cell);

    tab.appendChild(row);
  }

  root.appendChild(tab);
};


/**
 * Increments an event by a value.
 *
 * @param {string} id The id of the event to increment.
 * @param {int} count The count you want to increment the event.
 */
events.incrementEvent = function(id, count) {
  console.log('Incrementing event: ' + id);
  mockTime = new Date().getTime();
  gapi.client.games.events.record(
      {
        'kind': 'games#eventRecordRequest',
        'requestId': mockTime,
        'currentTimeMillis': mockTime,
        'timePeriods': [
          {
            'kind': 'games#eventPeriodUpdate',
            'timePeriod': {
              'kind': 'games#eventPeriodRange',
              'periodStartMillis': mockTime - 100000,
              'periodEndMillis': mockTime - 100
            },
            'updates': [
              {
                'kind': 'games#eventUpdateRequest',
                'definitionId': id,
                'updateCount': 1
              }
            ]
          }
        ]
      }).execute(function(resp) {
    var events = resp.playerEvents;
    for (var i = 0; i < events.length; i++) {
      document.getElementById(events[i].definitionId).innerText =
          events[i].formattedNumEvents;
    }
  });
};


/**
 * Resets the currently populated event for the current user.
 */
events.resetCurrentEvent = function() {
  var eventId = events.getCurrentEventId();
  gapi.client.gamesManagement.events.reset({eventId: eventId}).execute(
      function(resp) {
        console.log('Current Event Reset');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp,
            'Event reset for current player.');
      });
};


/**
 * Resets all events for the currently authenticated user.
 */
events.resetAllEventsForMe = function() {
  console.log('Resetting all events for the current user.');
  gapi.client.gamesManagement.events.resetAll().execute(function(resp) {
    console.log('Events reset, response:');
    console.log(resp);
    utilities.checkApiResponseAndNotify(resp,
        'All events reset for current player.');
  });
};


/**
 * Resets the currently populated event for all users.
 */
events.resetCurrentEventForAll = function() {
  console.log('Resetting current event for everybody.');
  var eventId = events.getCurrentEventId();
  gapi.client.gamesManagement.events.resetForAllPlayers({eventId: eventId}).
      execute(function(resp) {
        console.log('Events reset, response:');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp,
            'Current event reset for all players.');
      });
};


/**
 * Resets the events specified in the current event IDs field.
 */
events.resetCurrentMultipleForAll = function() {
  var eventsList = utilities.trimWhitespace(
      document.getElementById('event-ids').value).split(',');
  gapi.client.gamesManagement.events.resetMultipleForAllPlayers(
      {'event_ids': eventsList}).execute(function(resp) {
    console.log('Resetting multiple events for all players:');
    console.log(resp);
    utilities.checkApiResponseAndNotify(resp,
        'Multiple events reset for all players.');
  });
};


/**
 * Resets all events for all users.
 */
events.resetAllForAll = function() {
  console.log('Resetting current event for everybody.');
  var eventId = events.getCurrentEventId();
  gapi.client.gamesManagement.events.resetAllForAllPlayers().
      execute(function(resp) {
        console.log('All events reset, response:');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp, 'All events reset.');
      });
};
