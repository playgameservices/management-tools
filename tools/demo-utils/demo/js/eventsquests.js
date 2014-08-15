/* Copyright (C) 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  *
 * Unless required by applicable law or agree to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// TODO: remove this logic.
// How many async loads have happened?
var events = {};
var quests = {};

// TODO (class) Use namespace and make state members internal.

/**
 * Updates the list of available events.
 *
 * TODO (class) Move HTML generation into helper.
 */
var updateEventsList = function(pageToken) {
  gapi.client.games.events.listDefinitions().execute(
    function(response){
      var content = '<table cellpadding=2 cellspacing=0 border=0>\n';
      content    += '  <tr style="color:#fff; background:#9F499B;">\n';
      content    += '    <th>Event Name</th><th>ID</th><th>Visibility</th>' +
          '<th>Count</th><th>Increment</th>\n';
      content    += '  </tr>\n';

      var events = response.items;
      console.log(events);
      for (var i=0; i < events.length; i++){
        content  += '  <tr style="background:#fff;">\n';
        content  += '    <td>' + events[i].displayName + '</td>';
        content  += '    <td><input size=25 type=text value=' +
            events[i].id + ' disabled></td>';
        content  += '    <td>' + events[i].visibility+ '</td>\n';
        content  += '    <td style="text-align: center;" id="' +events[i].id +
            '"></td>\n';
        content  += '    <td><button onclick="incrementEvent(\'' +
            events[i].id + '\', 1);">trigger</button></td>\n';
        content  += '  </tr>\n';
      }

      content    += '</table>'
      document.getElementById('eventsBox').innerHTML = content;
    }
  );
};


/**
 * Increments an event by a value.
 *
 * @param {string} id The id of the event to increment.
 * @param {int} count The count you want to increment the event.
 */
var incrementEvent = function(id, count) {
  mockTime = new Date().getTime();
  gapi.client.games.events.record(
  {
    "kind": "games#eventRecordRequest",
    "requestId": mockTime,
    "currentTimeMillis": mockTime,
    "timePeriods": [
      {
        "kind": "games#eventPeriodUpdate",
        "timePeriod": {
          "kind": "games#eventPeriodRange",
          "periodStartMillis": mockTime - 100000,
          "periodEndMillis": mockTime - 100
        },
        "updates": [
          {
            "kind": "games#eventUpdateRequest",
            "definitionId": id,
            "updateCount": 1
          }
        ]
      }
    ]
  }).execute(function(resp){
    var events = resp.playerEvents;
    for (var i=0; i< events.length; i++){
      document.getElementById(events[i].definitionId).innerText =
          events[i].formattedNumEvents;
    }
  });
};


/**
 * Updates the list of available quests and associated events.
 *
 * TODO (class) Clean up HTML generation into Polymer components.
 */
var updateQuestsList = function () {
  gapi.client.games.quests.list({playerId:'me'}).execute(
    function(response){
      var content = '';
      var quests = response.items;
      console.log(quests);
      for (var i=0; i < quests.length; i++){
        content  += '<h3>' + quests[i].name + ' - ' + quests[i].description +
                    '</h3><paper-button label="accept" ' +
                    'onClick="acceptQuest(\'' + quests[i].id +
                    '\')" class="eqButton"></paper-button> &nbsp;' +
                    '<paper-button label="Reset" class="eqButton" ' +
                    'onClick="resetQuest(\'' + quests[i].id + '\')">' +
                    '</paper-button>';
        var milestones = quests[i].milestones;

        content    += '<table cellpadding=0 cellspacing=0 border=0>\n';
        content    += '  <tr style="color:#fff; background:#9F499B;">\n';
        content    += '    <th>MileStoneId</th><th>Critera</th>';
        content    += '  </tr>\n';

        for (var j=0; j < milestones.length; j++){
          content  += '  <tr style="background:#fff;">\n';
          content  += '    <td>' + milestones[j].id + '</td>\n';
          content  += '    <td>\n';

          var criteria = milestones[j].criteria;

          content  += '<table>\n';
          content  += '<tr><th>Event</th><th>Contribution</th><th>Select</th>' +
              '</tr>';
          for (var k=0; k < criteria.length; k++){
            var currContribution = criteria[k].currentContribution ?
              criteria[k].currentContribution.formattedValue : 'n/a';
            var complContribution = criteria[k].completionContribution ?
              criteria[k].completionContribution.formattedValue : 'n/a';
            var initPlayerProgress = criteria[k].initialPlayerProgress ?
              criteria[k].initialPlayerProgress.formattedValue : 'n/a';

            content += '<tr><td>' + '<input size=42 type=text value="' +
                criteria[k].eventId + '" disabled></input></td>' +
                '<td>' + currContribution + ' / ' + complContribution +
                ' [' + initPlayerProgress + ']</td>';
            content  += '<td><button onclick="setCurrentEventId(\'' +
                criteria[k].eventId + '\')">Pick</button>\n</td></tr>';
          }
          content  += '</table>\n';
          content  += '    </td>';
        }
        content    += '</table>\n';
      }

      document.getElementById('questsBox').innerHTML = content;
    }
  );
}

/**
 * Accepts a quest, opening it up to be contributed towards.
 */
function acceptQuest(questId){
  gapi.client.games.quests.accept({questId: questId}).execute(function(resp){
    console.log(resp);
  });
}


/**
 * Gets the current event from the form input.
 *
 * @return {string} The current event ID.
 */
var getCurrentEventId = function(){
  return document.getElementById('selectedEvent').value;
}


/**
 * Sets the current event to the form input.
 *
 * @param {string} id The event ID to set the current event to.
 */
var setCurrentEventId = function(id){
  document.getElementById('selectedEvent').value = id;
}


/**
 * Resets the currently populated event for the current user.
 */
var resetQuest = function(questId){
  gapi.client.gamesManagement.quests.reset({questId: questId}).execute(
      function(resp){
        console.log(resp);
      });
}


/**
 * Resets the currently populated event for the current user.
 */
var resetCurrentEvent = function(){
  var eventId = getCurrentEventId();
  gapi.client.gamesManagement.events.reset({eventId: eventId}).execute(
      function(resp){
        console.log('Event reset, response:');
        console.log(resp);
      });
}


/**
 * Resets all events for the currently authenticated user.
 */
var resetAllEventsForMe = function() {
  console.log('Resetting all events for the current user.');
  gapi.client.gamesManagement.events.resetAll().execute(function(resp){
    console.log('Events reset, response:');
    console.log(resp);
  });
}


/**
 * Resets the currently populated event for all users.
 */
var resetCurrentEventForAll = function(){
  console.log('Resetting current event for everybody.');
  var eventId = getCurrentEventId();
  gamesManagement.events.resetForAllPlayer({eventId: eventId}).
      execute(function(resp){
        console.log('Events reset, response:');
        console.log(resp);
      });
}
