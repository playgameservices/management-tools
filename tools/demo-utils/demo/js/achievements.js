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


/**
 * Creates list of achievmeents
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
  cell = document.createElement('th');
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  cell.appendChild(document.createTextNode(
      'Total achievements on this page: ' +
      items.length));
  cell.setAttribute('colSpan', '7');
  row.appendChild(cell);
  tab.appendChild(row);

  row = document.createElement('tr');
  cell = document.createElement('th');
  cell.appendChild(document.createTextNode('Name'));
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  row.appendChild(cell);

  cell = document.createElement('th');
  cell.appendChild(document.createTextNode('ID'));
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  row.appendChild(cell);

  cell = document.createElement('th');
  cell.appendChild(document.createTextNode('steps'));
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  cell.setAttribute('colSpan', '2');
  row.appendChild(cell);

  cell = document.createElement('th');
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  cell.appendChild(document.createTextNode('state'));
  cell.setAttribute('colSpan', '2');
  row.appendChild(cell);

  cell = document.createElement('th');
  cell.style.backgroundColor = colors.accent1;
  cell.style.color = '#FFF';
  cell.appendChild(document.createTextNode('lastUpdated'));
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

    cell = document.createElement('td');
    console.log(item);
    console.log(achievements);
    cell.appendChild(document.createTextNode(achievements[item.id].name));
    row.appendChild(cell);

    cell = document.createElement('td');
    cell.appendChild(document.createTextNode(item.id));
    row.appendChild(cell);

    cell = document.createElement('td');
    if (achievements[item.id].totalSteps) {
      cell.appendChild(document.createTextNode(
          item.currentSteps +
          '/' +
          achievements[item.id].totalSteps));

    } else {
      cell.appendChild(document.createTextNode('no steps'));
    }

    row.appendChild(cell);

    cell = document.createElement('td');
    cell.appendChild(
        document.createTextNode(item.formattedCurrentStepsString));
    row.appendChild(cell);

    cell = document.createElement('td');
    cell.appendChild(document.createTextNode(item.achievementState));
    row.appendChild(cell);

    // Need an active button
    cell = document.createElement('td');
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('name', 'edit');
    button.setAttribute('value', item.id);
    button.appendChild(document.createTextNode('Pick me!'));
    button.addEventListener('click',
        achievements.sendAchievementDataToInputs, false);
    cell.appendChild(button);
    row.appendChild(cell);

    cell = document.createElement('td');
    cell.appendChild(document.createTextNode(item.lastUpdatedTimestamp));
    row.appendChild(cell);
    tab.appendChild(row);
  }
  root.appendChild(tab);
};


/**
 * Creates a button for the achievement page.
 *
 * @param {string} text The text for the button.
 * @param {function} handler The function handler for the function.
 * @return {Object} The object representing the button.
 */
achievements.createAchievementPageButton = function(text, handler) {
  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.setAttribute('name', 'edit');
  button.appendChild(document.createTextNode(text));
  button.addEventListener('click', handler, false);

  return button;
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

        if (response.prevPageToken) {
          root.appendChild(
              achievements.createAchievementPageButton(
              'Prev',
              function(event) {
                            achievements.showAchievementList(
                                response.prevPageToken);}));
        }
        if (response.nextPageToken) {
          root.appendChild(
              achievements.createAchievementPageButton(
              'Next',
              function(event) {
                            achievements.showAchievementList(
                                response.nextPageToken);}));
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
          alert('Achievment unlocked!  Refresh to see the difference.');
        } else {
          alert('Achievment unlocked!  However, it was always unlocked.');
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
          alert('Achievment unlocked!  Refresh to see the difference.');
        } else {
          alert('Achievment incremented!');
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
        if (response.error) {
          alert('Error ' + response.error.code +
              ': ' + response.error.message);
          return;
        }
        alert('Achievment reset!  Refresh to see the difference.');
      });
};


/**
 * Resets all achievements for a test account.
 */
achievements.resetAllAchievements = function() {
  gapi.client.gamesManagement.achievements.resetAll(
      {playerId: PLAYER_ID}).execute(
      function(response) {
        console.log('Response', response);
        if (response.error) {
          alert('Error ' + response.error.code +
              ': ' + response.error.message);
          return;
        }
        alert('All achievements reset!');
      });
};


/**
 * We have to wait for two libraries to load, and then
 * signin to occur before it's safe to show the logged in UI.
 */
achievements.checkAllUnitsLoaded = function() {
  // TODO: Activate / deactivate components.
};


/**
 * Initializes the achivements and related games details.
 */
achievements.initAchievements = function() {
  // Now that everything's loaded, we
  // grab the player Id and the list of achievements
  gapi.client.games.players.get({playerId: 'me'}).execute(
      function(response) {
        console.log(response);
        if (response.error) {
          alert('Player get failed: ' + response.error.message);
          return;
        }

        PLAYER_ID = response.playerId;
      });

  gapi.client.games.achievementDefinitions.list({playerId: 'me'}).execute(
      function(response) {
        console.log(response);
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
