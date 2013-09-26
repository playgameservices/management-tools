/* Copyright (C) 2013 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Please fill these out with the values from your
// actual game.  DON'T FORGET TO FILL OUT CLIENT_ID
// IN scorer.html!
var APP_ID = 'APP_ID';

// How many async loads have happened?
var UNITS_TO_LOAD = 3;
var unitsReady = 0;

var leaderboards = {};

/* Callback on signin check.
 *  Signin check happens both on page load and when you click
 *  the actual signin button.
 */
function signinCallback(authResult) {
    if (authResult['access_token']) {
        // Successfully authorized
        // Hide the sign-in button now that the user is authorized:
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

/** Creates list of leaderboards with buttons to get scores
 * @param {Object} root the element you want to append this to.
 * @param {Array} leaderboards a list of leaderboards.
 */
var createLeaderboardList = function(root, leaderboards) {

    if (!leaderboards) {
        leaderboards = [];
    }

    console.log('Show leaderboards');
    var tab = document.createElement('table');
    tab.className = 'gridtable';
    var row, cell;

    // Make the header
    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode(
                         'Total leaderboards on this page: ' +
                             leaderboards.length));
    row.appendChild(cell);
    tab.appendChild(row);

    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('name'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('id'));
    row.appendChild(cell);

    cell = document.createElement('th');
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('order'));
    row.appendChild(cell);

    tab.appendChild(row);

    // Now actually parse the data.
    for (var index in leaderboards) {
        item = leaderboards[index];
        row = document.createElement('tr');

        console.log('Name: ' + item.name +
                    ', id:' + item.id +
                    ' ' + item.iconUrl);
        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.name));
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.id));
        row.appendChild(cell);

        cell = document.createElement('td');

        var img = document.createElement('img');
        img.setAttribute('src', item.iconUrl + '?sz=50');
        img.setAttribute('height', '50px');
        img.setAttribute('width', '50px');
        cell.appendChild(img);
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.order));
        row.appendChild(cell);

        // Need an active button
        cell = document.createElement('td');
        var button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('name', 'edit');
        button.setAttribute('value', item.id);
        button.appendChild(document.createTextNode('Get my scores!'));
        button.addEventListener('click', sendLeaderboardDataToInputs, false);
        cell.appendChild(button);
        row.appendChild(cell);

        tab.appendChild(row);
    }
    root.appendChild(tab);
};

/** Creates visible list of scores
 * @param {Object} root the element you want to append this to.
 * @param {Array} scores a list of high scores.
 */
var createScoresList = function(root, scores) {

    if (!scores) {
        scores = [];
    }

    console.log('Show scores');
    var tab = document.createElement('table');
    tab.className = 'gridtable';
    var row, cell;

    // Make the header
    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode(
                         'Total scores on this page: ' +
                             scores.length));
    row.appendChild(cell);
    tab.appendChild(row);

    row = document.createElement('tr');
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('leaderboard_id'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('scoreString'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('public rank'));
    row.appendChild(cell);

    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('social rank'));
    row.appendChild(cell);

    tab.appendChild(row);

    // Now actually parse the data.
    for (var index in scores) {
        item = scores[index];
        row = document.createElement('tr');

        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.leaderboard_id));
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(item.scoreString));
        row.appendChild(cell);

        cell = document.createElement('td');
        if (item.publicRank) {
            cell.appendChild(document.createTextNode(
                                 item.publicRank.formattedRank +
                                     '/' + item.publicRank.formattedNumScores));
        } else {
            cell.appendChild(document.createTextNode(
                                 'No public rank'));
        }
        row.appendChild(cell);

        cell = document.createElement('td');
        if (item.socialRank) {
            cell.appendChild(document.createTextNode(
                                 item.socialRank.formattedRank +
                                     '/' + item.socialRank.formattedNumScores));
        } else {
            cell.appendChild(document.createTextNode(
                                 'No social rank'));
        }
        row.appendChild(cell);

        tab.appendChild(row);
    }
    root.appendChild(tab);
};

function createPageButton(text, handler) {
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('name', 'edit');
    button.setAttribute('value', item.player.playerId);
    button.appendChild(document.createTextNode(text));
    button.addEventListener('click', handler, false);

    return button;
}

/** Load a list of leaderboards and show it
 * @param {String} pageToken a REST API paging token string, or null. */
function showLeaderboardList(pageToken) {
    $('#leaderboardListDiv').html('');
    $('#leaderboardListDiv').show('fast');

    // Create the request.
    var request = gapi.client.games.leaderboards.list(
        { pageToken: pageToken,
         maxResults: '10'});

    request.execute(
        function(response) {
            console.log('High score', response);
            if (response.error) {
                alert('Error ' + response.error.code + ': ' + response.message);
                return;
            }

            var root = document.getElementById('leaderboardListDiv');
            createLeaderboardList(root, response.items);

            if (response.prevPageToken) {
                root.appendChild(
                    createPageButton(
                        'Prev',
                        function(event) {
                            showHighScoreList(response.prevPageToken);}));
            }
            if (response.nextPageToken) {
                root.appendChild(
                    createPageButton(
                        'Next',
                        function(event) {
                            showHighScoreList(response.nextPageToken);}));
            }
        });
}


/** Load the current set of scores.  No paging token, since you
 * can at most get three scores back (ALL_TIME, WEEKLY, DAILY)
 * @param {string} leaderboardId Leaderboard you wish to get scores for
 */
function showScoresList(leaderboardId) {
    $('#scoresListDiv').html('');
    $('#scoresListDiv').show('fast');

    // Create the request.
    var request = gapi.client.games.scores.get(
        { timeSpan: 'ALL',
          playerId: 'me',
          includeRankType: 'ALL',
          leaderboardId: leaderboardId});

    request.execute(
        function(response) {
            console.log('Get scores', response);
            if (response.error) {
                alert('Error ' + response.error.code + ': ' + response.message);
                return;
            }

            var root = document.getElementById('scoresListDiv');
            createScoresList(root, response.items);

        });
}

/** Responds to "Get my scores!"
 * Fills in the textboxes at the bottom of the page with the right data
 * and loads the high score list.
 * @param {Object} event the mouse event from clicking the button*  */
var sendLeaderboardDataToInputs = function(event) {
    console.log(event.target.value);

    document.getElementById('leaderboardIdInput').value =
        event.target.value;

    document.getElementById('leaderboardResetIdInput').value =
        event.target.value;

    showScoresList(event.target.value);
};

/** Submit a high score */
var submitScore = function() {
    var id = document.getElementById('leaderboardResetIdInput').value;

    if (id == '') {
        alert('You need to enter a valid leaderboard id.');
        return;
    }

    var score = document.getElementById('playerScoreInput').value;

    if (score == '') {
        alert('You need to enter a valid score to submit.');
        return;
    }

    console.log('Submitting score' + score);

    gapi.client.games.scores.submit(
        {leaderboardId: id,
         score: score}).execute(
             function(response) {
                 console.log('Submit score:', response);
                 if (response.error != null) {
                     alert('Error submitting score: ' +
                           response.error.code + ': ' + response.error.message);
                 }
                 else
                 {
                     alert('Score submitted! Get your scores again to see ' +
                           'the difference.');
                 }
             });
};

/** Resets a given player's score on a leaderboard. */
var resetLeaderboard = function() {
  var id = document.getElementById('leaderboardResetIdInput').value;

  if (id == '') {
    alert('You need to enter a valid leaderboard id.');
    return;
  }

  gapi.client.gamesManagement.scores.reset(
    {leaderboardId: id}).execute(
        function(response) {
            console.log('leaderboard reset:', response);
            if (response.error != null) {

                alert('Error resetting leaderboard: ' +
                      response.error.code + ': ' + response.error.message);
            }
            else
            {
                alert('Leaderboard reset!  Get your scores again ' +
                      'to see the effect.');
            }
     });
};

/** We have to wait for two libraries to load and then
 * signin to occur before it's safe to show the logged in UI. */
function checkAllUnitsLoaded() {
    if (unitsReady >= UNITS_TO_LOAD) {
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
