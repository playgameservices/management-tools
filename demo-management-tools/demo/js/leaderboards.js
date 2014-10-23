/* Copyright (C) 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



var leaderboards = leaderboards || {};
var utilities = utilities || {};


/** Creates list of leaderboards with buttons to get scores
 *
 * @param {Object} root the element you want to append this to.
 * @param {Array} leaderboards a list of leaderboards.
 */
leaderboards.createLeaderboardList = function(root, leaderboards) {

  if (!leaderboards) {
    leaderboards = [];
  }

  console.log('Show leaderboards');
  var tab = document.createElement('table');
  tab.className = 'gridtable';
  var row, cell;

  // Make the header
  row = document.createElement('tr');

  var cellText = 'Total leaderboards on this page: ' + leaderboards.length;
  cell = utilities.createCell('th', cellText, '#e81d62', '#FFF', 5);
  row.appendChild(cell);
  tab.appendChild(row);

  row = document.createElement('tr');
  cell = utilities.createCell('th', 'name', '#e81d62', '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'id', '#e81d62', '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', '', '#e81d62', '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'order', '#e81d62', '#FFF');
  row.appendChild(cell);

  cell = utilities.createCell('th', '', '#e81d62', '#FFF');
  row.appendChild(cell);

  tab.appendChild(row);

  // Now actually parse the data.
  for (var index in leaderboards) {
    item = leaderboards[index];
    row = document.createElement('tr');
    row.style.backgroundColor = index & 1 ? '#CCC' : '#FFF';

    cell = utilities.createCell('td', item.name);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.id);
    row.appendChild(cell);

    cell = utilities.createCell('td');
    var img = document.createElement('img');
    img.setAttribute('src', item.iconUrl + '?sz=50');
    img.setAttribute('height', '50px');
    img.setAttribute('width', '50px');
    cell.appendChild(img);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.order);
    row.appendChild(cell);

    // Need an active button
    cell = utilities.createCell('td');
    var button = document.createElement('button');
    var button = utilities.createButton('Get my scores!', item.id,
        function(event) {
          sendLeaderboardDataToInputs(event);
        });
    cell.appendChild(button);
    row.appendChild(cell);

    tab.appendChild(row);
  }
  root.appendChild(tab);
};


/**
 * Creates visible list of scores
 *
 * @param {Object} root the element you want to append this to.
 * @param {Array} scores a list of high scores.
 */
leaderboards.createScoresList = function(root, scores) {
  if (!scores) {
    scores = [];
  }

  console.log('Show scores');
  var tab = document.createElement('table');
  tab.className = 'gridtable';
  var row, cell;

  // Make the header
  row = document.createElement('tr');
  row.style.backgroundColor = '#e81d62';
  row.style.color = '#FFF';

  var cellString = 'Total scores on this page: ' + scores.length;
  cell = utilities.createCell('th', cellString, undefined, undefined, 4);
  row.appendChild(cell);
  tab.appendChild(row);

  row = document.createElement('tr');
  row.style.backgroundColor = '#e81d62';
  row.style.color = '#FFF';
  cell = utilities.createCell('th', 'leaderboard_id');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'scoreString');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'public rank');
  row.appendChild(cell);

  cell = utilities.createCell('th', 'social rank');
  row.appendChild(cell);

  tab.appendChild(row);

  // Now actually parse the data.
  for (var index in scores) {
    item = scores[index];
    row = document.createElement('tr');
    row.style.backgroundColor = index & 1 ? '#CCC' : '#FFF';

    cell = utilities.createCell('td', item.leaderboard_id);
    row.appendChild(cell);

    cell = utilities.createCell('td', item.scoreString);
    row.appendChild(cell);

    var cellText = 'No public rank';
    if (item.publicRank) {
      cellText = item.publicRank.formattedRank + '/' +
          item.publicRank.formattedNumScores;
    }
    cell = utilities.createCell('td', cellText);
    row.appendChild(cell);

    cellText = 'No social rank';
    if (item.socialRank) {
      cellText = item.socialRank.formattedRank + '/' +
          item.socialRank.formattedNumScores;
    }
    cell = utilities.createCell('td', cellText);
    row.appendChild(cell);

    tab.appendChild(row);
  }
  root.appendChild(tab);
};


/**
 * Load a list of leaderboards and show it
 *
 * @param {String} pageToken a REST API paging token string, or null.
 */
leaderboards.showLeaderboardList = function(pageToken) {
  document.querySelector('#leaderboardListDiv').innerHTML = '';
  document.querySelector('#leaderboardListDiv').style.display = 'block';

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
        leaderboards.createLeaderboardList(root, response.items);

        if (response.prevPageToken) {
          root.appendChild(
              utilities.createButton('Prev', response.prevPageToken,
                  function(event) {
                    player.showHighScoreList(event.target.value);
                  }));
        }
        if (response.nextPageToken) {
          root.appendChild(
              utilities.createButton('Next', response.nextPageToken,
                  function(event) {
                    player.showHighScoreList(event.target.value);
                  }));
        }
      });
};


/**
 * Resets my scores on all leaderboards.
 */
leaderboards.resetMyScores = function() {
  gapi.client.gamesManagement.scores.resetAll().execute(
      function(response) {
        console.log('reset all scores: ', response);
        utilities.checkApiResponseAndNotify(response,
            'All scores reset!  Get your scores again to see the effect.');
      });

};


/**
 * Resets all scores on all leaderboards for whitelisted users.
 */
leaderboards.resetAllForAllPlayers = function() {
  gapi.client.gamesManagement.scores.resetAllForAllPlayers().execute(
      function(response, raw) {
        console.log('reset all scores: ', response);
        console.log('reset raw all scores: ', raw);
        utilities.checkApiResponseAndNotify(resp,
            'All scores for all players reset! Get your scores again to see ' +
            'the effect.');
      });
};


/**
 * Resets all scores on all leaderboards for whitelisted users.
 */
leaderboards.resetMultipleForAllPlayers = function() {
  var leaderboard_ids = utilities.trimWhitespace(
          document.getElementById('multiLeaderboard').value).split(',');
  console.log(leaderboard_ids);
  gapi.client.gamesManagement.scores.resetMultipleForAllPlayers(
    {leaderboard_ids: leaderboard_ids}).execute(
      function(response, raw) {
        console.log('reset all scores: ', response);
        console.log('reset raw all scores: ', raw);
        utilities.checkApiResponseAndNotify(response,
            'All scores for all players reset! Get your scores again to see ' +
            'the effect.');
      });
};


/**
 * Load the current set of scores.  No paging token, since you
 * can at most get three scores back (ALL_TIME, WEEKLY, DAILY)
 *
 * @param {string} leaderboardId Leaderboard you wish to get scores for
 */
leaderboards.showScoresList = function(leaderboardId) {
  document.querySelector('#scoresListDiv').innerHTML = '';
  document.querySelector('#scoresListDiv').style.display = 'block';
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
        leaderboards.createScoresList(root, response.items);
      });
};


/**
 * Fills in the textboxes at the bottom of the page with the right data
 * and loads the high score list.
 *
 * @param {Object} event the mouse event from clicking the button*
 *
 * Note: This must be global.
 */
sendLeaderboardDataToInputs = function(event) {
  console.log(event);
  document.getElementById('leaderboardIdInput').value = event.target.value;
  document.getElementById('leaderboardIdShowHS').value = event.target.value;
  document.getElementById('leaderboardResetIdInput').value =
      event.target.value;
  leaderboards.showScoresList(event.target.value);
};


/**
 * Submit a high score
 */
leaderboards.submitScore = function() {
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


/**
 * Resets a given player's score on a leaderboard.
 */
leaderboards.resetLeaderboard = function() {
  var id = document.getElementById('leaderboardResetIdInput').value;
  if (id == '') {
    alert('You need to enter a valid leaderboard id.');
    return;
  }
  gapi.client.gamesManagement.scores.reset(
      {leaderboardId: id}).execute(
      function(response) {
        console.log('leaderboard reset:', response);
        utilities.checkApiResponseAndNotify(response,
            'Leaderboard reset! Get your scores again to see the effect.');
      });
};


/**
 * Resets all scores for all players on a leaderboard.
 */
leaderboards.resetLeaderboardForAll = function() {
  var id = document.getElementById('leaderboardResetIdInput').value;
  if (id == '') {
    alert('You need to enter a valid leaderboard id.');
    return;
  }
  gapi.client.gamesManagement.scores.resetForAllPlayers(
      {leaderboardId: id}).execute(
      function(response) {
        console.log('leaderboard reset:', response);
        utilities.checkApiResponseAndNotify(response,
            'Leaderboard reset! Get your scores again to see the effect.');
      });
};
