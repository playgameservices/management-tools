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
var utilities = utilities || {};


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

    root.appendChild(document.createElement('p'));

    var idText = document.createElement('textarea');
    idText.className = 'questIdArea';
    idText.value = 'Quest ID: ' + quest.id;
    root.appendChild(idText);

    root.appendChild(utilities.createButton('Accept', quest.id,
        function(evt) {
          quests.acceptQuest(evt.target.value);
        }));

    root.appendChild(utilities.createButton('Reset', quest.id,
        function(evt) {
          quests.resetQuest(evt.target.value);
        }));

    root.appendChild(utilities.createButton('Reset for All', quest.id,
        function(evt) {
          quests.resetQuestForAll(evt.target.value);
        }));

    var tab = document.createElement('table');
    tab.className = 'gridtable';
    var row, cell;

    // Make the header
    row = document.createElement('tr');
    row.style.backgroundColor = colors.accent4;
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
      innerRow.style.backgroundColor = colors.accent4;
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
 * Resets the specified quest for the current user.
 *
 * @param {string} questId The identifier for the quest to reset.
 */
quests.resetQuest = function(questId) {
  gapi.client.gamesManagement.quests.reset({questId: questId}).execute(
      function(resp) {
        console.log('A quest was reset.');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp, 'Quest reset.');
      });
};


/**
 * Resets all quests for the current user.
 */
quests.resetAllMyQuests = function() {
  gapi.client.gamesManagement.quests.resetAll().execute(
      function(resp) {
        console.log('Reset the current player\'s quests.');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp,
            'All quests reset for current player.');
      });
};


/**
 * Resets the specified quest for all players.
 *
 * @param {string} questId The identifier for the quest to reset.
 */
quests.resetQuestForAll = function(questId) {
  gapi.client.gamesManagement.quests.resetForAllPlayers({questId: questId}).
      execute(
      function(resp) {
        console.log('Quest was reset for all players.');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp,
            'Quest reset for all players.');
      });
};


/**
 * Resets the quests specified in the current quest IDs field.
 */
quests.resetCurrentMultiple = function() {
  var questsList = utilities.trimWhitespace(
          document.getElementById('quest-ids').value).split(',');
  gapi.client.gamesManagement.quests.resetMultipleForAllPlayers(
      {quest_ids: questsList}).execute(function(resp) {
    console.log('Multiple Quests reset for all players');
    console.log(resp);
    utilities.checkApiResponseAndNotify(resp, 'Multiple quests reset.');
  });
};


/**
 * Resets all quests for all players.
 */
quests.resetAllForAll = function() {
  gapi.client.gamesManagement.quests.resetAllForAllPlayers().execute(
      function(resp) {
        console.log('All quests were reset.');
        console.log(resp);
        utilities.checkApiResponseAndNotify(resp, 'All quests were reset');
      });
};


