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



var achievements = achievements || {};
var utilities = utilities || {};


/**
 * Creates list of achievmeents.
 *
 * @param {Object} root the element you want to append this to.
 * @param {Array} items the list of achievements
 */
achievements.createAchievementList = function(root, items) {
  console.log('Show achievements');
  var tab = document.createElement('table');
  tab.className = 'gridtable';
  var row, cell;

  // Make the header
  row = document.createElement('tr');
  var cellText = 'Total achievements on this page: ' + items.length;
  cell = utilities.createCell('th', cellText, colors.accent1, '#FFF', 7);
  row.appendChild(cell);
  tab.appendChild(row);

  row = document.createElement('tr');
  cell = utilities.createCell('th', 'Name', colors.accent1, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'ID', colors.accent1, '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'steps', colors.accent1, '#FFF', 2);
  row.appendChild(cell);

  cell = utilities.createCell('th', 'state', colors.accent1, '#FFF', 2);
  row.appendChild(cell);

  cell = utilities.createCell('th', 'lastUpdated', colors.accent1, '#FFF', 2);
  row.appendChild(cell);

  tab.appendChild(row);

  // Now actually parse the data.
  var on = 0;
  for (var index in items) {
    item = items[index];
    row = document.createElement('tr');
    if (on === 0) {
      on = 1;
      row.style.backgroundColor = '#FFF';
    }else {
      on = 0;
      row.style.backgroundColor = '#CCC';
    }

    console.log(item);
    console.log(achievements);

    cell = utilities.createCell('td', achievements[item.id].name);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.id);
    row.appendChild(cell);

    var cellText = 'no steps';
    if (achievements[item.id].totalSteps) {
      cellText = item.currentSteps + '/' + achievements[item.id].totalSteps;
    }
    cell = utilities.createCell('td', cellText);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.formattedCurrentStepsString);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.achievementState);
    row.appendChild(cell);

    // Need an active button
    cell = utilities.createCell('td');
    var button = utilities.createButton('Pick me!', item.id,
        achievements.sendAchievementDataToInputs);
    cell.appendChild(button);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.lastUpdatedTimestamp);
    row.appendChild(cell);
    tab.appendChild(row);
  }
  root.appendChild(tab);
};


/**
 * Load the current top 25 high scores and render them.
 *
 * @param {String} pageToken a REST API paging token string, or null.
 */
achievements.showAchievementList = function(pageToken) {
  console.log('Paging token is ' + pageToken);
  document.getElementById('achievementListDiv').innerHTML = '';
  document.getElementById('achievementListDiv').style.display = 'block';
  // Create the request.
  var request = gapi.client.games.achievements.list(
      {playerId: PLAYER_ID,
        state: 'ALL',
        pageToken: pageToken,
        maxResults: '10'});
  request.execute(
      function(response) {
        console.log('High score', response);
        if (response.error) {
          alert('Error ' + response.error.code + ': ' + response.message);
          return;
        }
        var root = document.getElementById('achievementListDiv');
        achievements.createAchievementList(root, response.items, true);

        var prevClick = function(event) {
          achievements.showAchievementList(response.prevPageToken);
        };
        if (response.prevPageToken) {
          root.appendChild(
              utilities.createButton('Prev', undefined, prevClick));
        }
        var nextClick = function(event) {
          achievements.showAchievementList(response.nextPageToken);
        };
        if (response.nextPageToken) {
          root.appendChild(
              utilities.createButton('Next', undefined, nextClick));
        }
      });
};


/**
 * Fills in the textboxes at the bottom of the page with the user's ID
 *
 * @param {Object} event the mouse event from clicking the button.
 */
achievements.sendAchievementDataToInputs = function(event) {
  console.log(event.target.value);
  document.getElementById('resetAchievementInput').value =
      event.target.value;
  document.getElementById('stepsAchievementInput').value =
      event.target.value;
  document.getElementById('unlockAchievementInput').value =
      event.target.value;
};


/**
 * Unlocks an achievement.
 */
achievements.unlockAchievement = function() {
  var achievementId = document.getElementById(
      'unlockAchievementInput').value;
  console.log('Unlocking ' + achievementId);

  gapi.client.games.achievements.unlock(
      {playerId: PLAYER_ID,
        achievementId: achievementId}).execute(
      function(response) {
        console.log('Response', response);
        if (response.error) {
          alert('Error ' + response.error.code +
              ': ' + response.error.message);
          return;
        }
        if (response.newlyUnlocked) {
          alert('Achievement unlocked!  Refresh to see the difference.');
        } else {
          alert('Achievement unlocked!  However, it was always unlocked.');
        }
      });
};


/**
 * Increments an achievement.
 */
achievements.incrementAchievement = function() {
  var achievementId = document.getElementById(
      'stepsAchievementInput').value;
  var steps = document.getElementById(
      'stepsInput').value;
  console.log('Incrementing ' + achievementId + ' ' + steps);

  gapi.client.games.achievements.increment(
      {playerId: PLAYER_ID,
        stepsToIncrement: steps,
        achievementId: achievementId}).execute(
      function(response) {
        console.log('Response', response);
        if (response.error) {
          alert('Error ' + response.error.code +
              ': ' + response.error.message);
          return;
        }
        if (response.newlyUnlocked) {
          alert('Achievement unlocked!  Refresh to see the difference.');
        } else {
          alert('Achievement incremented!');
        }
      });
};


/**
 * Resets an achievement.
 */
achievements.resetAchievement = function() {
  var achievementId = document.getElementById(
      'resetAchievementInput').value;
  console.log('Resetting ' + achievementId);

  gapi.client.gamesManagement.achievements.reset(
      {playerId: PLAYER_ID,
        achievementId: achievementId}).execute(
      function(response) {
        console.log('Response', response);
        utilities.checkApiResponseAndNotify(response,
            'Achievement reset!  Refresh to see the difference.');
      });
};


/**
 * Resets the specified achievement for all players.
 */
achievements.resetAchievementForAll = function() {
  var achievementId = document.getElementById('resetAchievementInput').value;
  console.log('Resetting ' + achievementId + ' for all players.');

  gapi.client.gamesManagement.achievements.resetForAllPlayers(
      {achievementId: achievementId}).execute(
        function(resp) {
          console.log(resp);
          utilities.checkApiResponseAndNotify(resp,
              'Achievement reset for all players.');
        });
};


/**
 * Resets all achievements for a test account.
 */
achievements.resetAllAchievements = function() {
  gapi.client.gamesManagement.achievements.resetAll(
      {playerId: PLAYER_ID}).execute(
      function(response) {
        console.log('Response from reset all achievements', response);
        utilities.checkApiResponseAndNotify(response,
            'All achievements reset!');
      });
};


/**
 * Resets all achievements for all test accounts.
 */
achievements.resetAllForAll = function() {
  gapi.client.gamesManagement.achievements.resetAllForAllPlayers().execute(
      function(response) {
        console.log('Response from reset all achievements', response);
        utilities.checkApiResponseAndNotify(response,
            'All achievements reset!');
      });
};


/**
 * Resets the quests specified in the current quest IDs field.
 */
achievements.resetCurrentMultiple = function() {
  var achievementList = utilities.trimWhitespace(
      document.getElementById('ach-ids').value).split(',');

  gapi.client.gamesManagement.achievements.resetMultipleForAllPlayers(
      {achievement_ids: achievementList}).execute(function(resp) {
    console.log('Resopnse from reset curr multiple', resp);
    utilities.checkApiResponseAndNotify(resp, 'Multiple achievements reset.');
  });
};


/**
 * Initializes the achivements and related games details.
 */
achievements.initAchievements = function() {
  // Now that everything's loaded, we
  // grab the player Id and the list of achievements
  gapi.client.games.players.get({playerId: 'me'}).execute(
      function(response) {
        if (response.error) {
          alert('Player get failed: ' + response.error.message);
          return;
        }

        PLAYER_ID = response.playerId;
      });

  gapi.client.games.achievementDefinitions.list({playerId: 'me'}).execute(
      function(response) {
        if (response.error) {
          alert('Definitions get failed: ' + response.error.message);
          return;
        }

        for (var i = 0; i < response.items.length; i++) {
          var item = response.items[i];
          achievements[item.id] = item;
        }
      });
};


/**
 * Callback from loading client library.  You need a brief pause before
 * you initiate new loads and really start the app.
 */
achievements.onLoadCallback = function() {
  window.setTimeout(continueLoadingLibraries, 1);
};
