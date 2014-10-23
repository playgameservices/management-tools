
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



var multiplayer = multiplayer || {};
var utilities = utilities || {};


/**
 * Resets all realtime rooms for the current game.
 */
multiplayer.resetAllRealtimeRooms = function() {
  gapi.client.gamesManagement.rooms.resetForAllPlayers().execute(
      function(resp) {
        console.log('Reset all rooms for current game');
        console.log(resp);

        utilities.checkApiResponseAndNotify(resp,
            'Rooms reset for all players.');
      });
};


/**
 * Resets all realtime rooms for the current player.
 */
multiplayer.resetMyRealtimeRooms = function() {
  gapi.client.gamesManagement.rooms.reset().execute(function(resp) {
    console.log('Reset all rooms for current player');
    console.log(resp);

    utilities.checkApiResponseAndNotify(resp,
        'Room reset for current player.');
  });
};


/**
 * Resets all turnbased rooms for the current game.
 */
multiplayer.resetAllTurnbasedRooms = function() {
  gapi.client.gamesManagement.turnBasedMatches.resetForAllPlayers().execute(
      function(resp) {
        console.log('Reset turnbased rooms for all players');
        console.log(resp);

        utilities.checkApiResponseAndNotify(resp,
            'Turn-based rooms reset for all players.');
      });
};


/**
 * Resets all turnbased rooms for the current player.
 */
multiplayer.resetMyTurnbasedRooms = function() {
  gapi.client.gamesManagement.turnBasedMatches.reset().execute(function(resp) {
    console.log('Reset turnbased rooms for current player');
    console.log(resp);
    utilities.checkApiResponseAndNotify(resp,
        'Turn-based room reset for current player.');
  });
};
