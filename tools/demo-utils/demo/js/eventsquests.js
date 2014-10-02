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



var events = events || {};
var quests = quests || {};


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
 * Updates the list of available quests and associated events.
 *
 * @param {?string} pageToken The next page token from the previous API call.
 */
quests.updateQuestsList = function(pageToken) {
  gapi.client.games.quests.list({playerId: 'me', maxResults: 5,
    pageToken: pageToken}).execute(
      function(response) {
        var questList = response.items;
        if (!questList) return;

        var root = document.getElementById('questsBox');
        root.innerText = '';

        quests.createQuestsList(root, questList);

        if (response.nextPageToken) {
          var nextPage = utilities.createButton('Next', response.nextPageToken,
              function(event) {
                quests.updateQuestList(event.target.value);
              });
          root.appendChild(nextPage);
        }
      }
  );
};


/**
 * Creates list of Quests.
 *
 * @param {Object} root The element you want to append this to.
 * @param {Array} questList The list of Quests.
 */
quests.createQuestsList = function(root, questList) {
  console.log('Show quests');

  for (var index = 0; index < questList.length; index++) {
    if (index > 0) {
      root.appendChild(document.createElement('hr'));
    }

    var quest = questList[index];
    var title = document.createElement('h3');
    title.innerText = quest.name + ' - ' + quest.description;
    root.appendChild(title);

    root.appendChild(utilities.createButton('Accept', quest.id,
          function(evt) {
            quests.acceptQuest(evt.target.value);
          }));

    root.appendChild(utilities.createButton('Reset', quest.id,
        function(evt) {
          quests.resetQuest(evt.target.value);
        }));

    var tab = document.createElement('table');
    tab.className = 'gridtable';
    var row, cell;

    // Make the header
    row = document.createElement('tr');
    row.style.backgroundColor = colors.accent3;
    cell = utilities.createCell('th', 'MilestoneId', undefined, '#FFF');
    row.appendChild(cell);
    cell = utilities.createCell('th', 'Criteria', undefined, '#FFF');
    row.appendChild(cell);
    tab.appendChild(row);

    // Add the Milestone / criteria data
    var milestones = quest.milestones;
    for (var i = 0; i < milestones.length; i++) {
      var milestone = milestones[i];
      row = document.createElement('tr');
      row.style.backgroundColor = '#FFF';
      cell = utilities.createCell('td', milestone.id, undefined);
      row.appendChild(cell);

      var innerTab = document.createElement('table');

      // Add inner table header.
      var innerRow = document.createElement('tr');
      innerRow.style.backgroundColor = colors.accent3;
      innerRow.style.color = '#FFF';
      var innerCel = utilities.createCell('th', 'Event');
      innerRow.appendChild(innerCel);
      innerCel = utilities.createCell('th', 'Contribution');
      innerRow.appendChild(innerCel);
      innerCel = utilities.createCell('th', 'Select');
      innerRow.appendChild(innerCel);
      innerTab.appendChild(innerRow);

      // Add rows for milestone criteria.
      var criteria = milestone.criteria;
      for (var j = 0; j < criteria.length; j++) {
        var currContribution = criteria[j].currentContribution ?
            criteria[j].currentContribution.formattedValue : 'n/a';
        var complContribution = criteria[j].completionContribution ?
            criteria[j].completionContribution.formattedValue : 'n/a';
        var initPlayerProgress = criteria[j].initialPlayerProgress ?
            criteria[j].initialPlayerProgress.formattedValue : 'n/a';
        var completionString = currContribution + ' / ' + complContribution +
                  ' [' + initPlayerProgress + ']';

        innerRow = document.createElement('tr');

        var textInput = utilities.createTextInput(42, criteria[j].eventId,
            true);
        innerCel = utilities.createCell('td', undefined, undefined, undefined,
            undefined, textInput);
        innerRow.appendChild(innerCel);
        innerCel = utilities.createCell('td', completionString);
        innerRow.appendChild(innerCel);
        innerCel = utilities.createCell('td');
        var tempButton = utilities.createButton('Pick', criteria[j].eventId,
            function(evt) {
              events.setCurrentEventId(evt.target.value);
            });
        innerCel.appendChild(tempButton);
        tempButton = utilities.createButton('Trigger', criteria[j].eventId,
            function(evt) {
              events.incrementEvent(evt.target.value);
            });
        innerCel.appendChild(tempButton);
        innerRow.appendChild(innerCel);
        innerTab.appendChild(innerRow);
      }
      cell = utilities.createCell('td');
      cell.appendChild(innerTab);
      row.appendChild(cell);
      tab.appendChild(row);
    }
    root.appendChild(tab);
  }
  console.log(tab);
};


/**
 * Accepts a quest, opening it up to be contributed towards.
 *
 * @param {string} questId The identifier for the quest to accept.
 */
quests.acceptQuest = function(questId) {
  console.log('Accepting quest: ' + questId);
  gapi.client.games.quests.accept({questId: questId}).execute(function(resp) {
    console.log('Accepted request response:');
    console.log(resp);
  });
};


/**
 * Gets the current event from the form input.
 *
 * @return {string} The current event ID.
 */
events.getCurrentEventId = function() {
  return document.getElementById('selectedEvent').value;
};


/**
 * Sets the current event to the form input.
 *
 * @param {string} id The event ID to set the current event to.
 */
events.setCurrentEventId = function(id) {
  document.getElementById('selectedEvent').value = id;
};


/**
 * Resets the currently populated event for the current user.
 *
 * @param {string} questId The identifier for the quest to reset.
 */
quests.resetQuest = function(questId) {
  gapi.client.gamesManagement.quests.reset({questId: questId}).execute(
      function(resp) {
        console.log('A quest was reset.');
        console.log(resp);
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
      });
};
