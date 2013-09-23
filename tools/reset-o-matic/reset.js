/* Copyright (C) 2013 Google Inc.
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

// Please fill these out with the values from your
// actual game.  DON'T FORGET TO FILL OUT CLIENT_ID
// IN achievements.html!
var APP_ID = 'APP_ID';

// How many async loads have happened?
var UNITS_TO_LOAD = 3;
var unitsReady = 0;

var DATA_TO_LOAD = 2;
var dataReady = 0;
var achievements = {};

/* Callback on signin check.
 *  Signin check happens both on page load and when you click
 *  the actual signin button.
 */
function signinCallback(authResult) {
    if (authResult['access_token']) {
        console.log('Logged in');
        // Successfully authorized
        // Hide the sign-in button now that the user is authorized, for example:
        document.getElementById('signinButton')
            .setAttribute('style', 'display: none');
        // One of the async actions have happened
        unitsReady++;
        checkAllUnitsLoaded();
    } else if (authResult['error']) {
        // There was an error.
        // Possible error codes:
        //   "access_denied" - User denied access to your app
        //   "immediate_failed" - Could not automatically log in the user
        console.log('There was an error: ' + authResult['error']);

        document.getElementById('signinButton')
            .setAttribute('style', 'display: visible');
        document.getElementById('loggedInUI')
            .setAttribute('style', 'display: none');
  }
}

/** Creates list of achievmeents
 * @param {Object} root the element you want to append this to.
 * @param {Array} items the list of achievements */

var createAchievementList = function(root, items) {

    console.log('Show achievements');
    var tab = document.createElement('table');
    tab.className = 'gridtable';
    var row, cell;

    // Make the header
    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode(
                         'Total achievements on this page: ' +
                             items.length));
    row.appendChild(cell);
    tab.appendChild(row);

    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('Name'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('ID'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('steps'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('state'));
    row.appendChild(cell);

    cell = document.createElement('th');

    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('lastUpdated'));
    row.appendChild(cell);

    tab.appendChild(row);

    // Now actually parse the data.
    for (var index in items) {
        item = items[index];
        row = document.createElement('tr');

        cell = document.createElement('td');
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
        cell.appendChild(document.createTextNode(item.formattedCurrentStepsString));
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
        button.addEventListener('click', sendAchievementDataToInputs, false);
        cell.appendChild(button);
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.lastUpdatedTimestamp));
        row.appendChild(cell);

        tab.appendChild(row);
    }
    root.appendChild(tab);
};

function createPageButton(text, handler) {
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('name', 'edit');
    button.appendChild(document.createTextNode(text));
    button.addEventListener('click', handler, false);

    return button;
}

/** Load the current top 25 high scores and render them.
 * @param {String} pageToken a REST API paging token string, or null. */
function showAchievementList(pageToken) {
    $('#achievementListDiv').html('');
    $('#achievementListDiv').show('fast');

    console.log('Paging token is ' + pageToken);

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
            createAchievementList(root, response.items, true);

            if (response.prevPageToken) {
                root.appendChild(
                    createPageButton(
                        'Prev',
                        function(event) {
                            showAchievementList(response.prevPageToken);}));
            }
            if (response.nextPageToken) {
                root.appendChild(
                    createPageButton(
                        'Next',
                        function(event) {
                            showAchievementList(response.nextPageToken);}));
            }
        });
}

/** Responds to "Pick me!"
 * Fills in the textboxes at the bottom of the page with the user's ID
 * @param {Object} event the mouse event from clicking the button*  */
var sendAchievementDataToInputs = function(event) {
    console.log(event.target.value);

    document.getElementById('resetAchievementInput').value =
        event.target.value;

    document.getElementById('stepsAchievementInput').value =
        event.target.value;

    document.getElementById('unlockAchievementInput').value =
        event.target.value;

};

var unlockAchievement = function() {
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

var incrementAchievement = function() {
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

/** Use gamesManagement to reset an achievement */
var resetAchievement = function() {
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

/** Use gamesManagement to reset an achievement */
var resetAllAchievements = function() {
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



/** We have to wait for two libraries to load, and then
 * signin to occur before it's safe to show the logged in UI. */
function checkAllUnitsLoaded() {
    if (unitsReady >= UNITS_TO_LOAD) {

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
                dataReady++;
                checkAllDataLoaded();
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
                dataReady++;
                checkAllDataLoaded();
            });

    }
}

function checkAllDataLoaded() {

    // If all the data is ready
    if (dataReady >= DATA_TO_LOAD) {
        document.getElementById('loggedInUI')
            .setAttribute('style', 'display: visible');
    }
}

/** Callback from loading client library.  You need a brief pause before
    you initiate new loads and really start the app. */
var onLoadCallback = function() {
  window.setTimeout(continueLoadingLibraries, 1);
};

var continueLoadingLibraries = function() {
    div = document.getElementById('errorDiv');

    if (APP_ID == 'APP_ID') {
        div.innerHTML = '<h3>Warning:  You have not yet set the APP_ID!</h3>';
    } else {
        div.innerHTML = '';
    }

    gapi.client.load('games', 'v1', function(response) {
                         console.log('Games loaded.');
                         unitsReady++;
                         checkAllUnitsLoaded();
                     });

    gapi.client.load('gamesManagement', 'v1management', function(response) {
                         console.log('Management loaded');
                         unitsReady++;
                         checkAllUnitsLoaded();
                     });
};
