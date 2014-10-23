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



var snapshots = snapshots || {};
var drive = drive || {};
var currSnapshotIds = [];
var writtenData;


/** A cached snapshot metadata object. */
snapshots.lastSnapshot = {};


/** The path used to host public files on drive. */
drive.DRIVE_HOST_PATH = 'https://googledrive.com/host/';


/** A constant for the host folder name used for this game's snapshots. */
drive.HOST_FOLDER = 'snapshotImages';


/**
 * List snapshots for the current user.
 */
snapshots.updateSnapshotList = function() {
  var callback = function(resp) {
    var root = document.getElementById('snapshotsListArea');
    var formElement = document.createElement('form');

    if (resp.items) {
      currSnapshotIds = [];
      for (var i = 0; i < resp.items.length; i++) {
        formElement.appendChild(
            snapshots.generateSnapshotRadio(resp.items[i].id,
                resp.items[i].description, resp.items[i].coverImage,
                (i < (resp.items.length - 1))));
      }
    }
    root.appendChild(formElement);
  };

  snapshots.listSnapshots('me', callback);
};


/**
 * Generates a snapshot radio button.
 *
 * @param {string} id The snapshot ID.
 * @param {string} description The snapshot description.
 * @param {string} coverImage The cover image URL.
 * @param {boolean} doHr Set to true to append a HR element.
 * @return {Object} The radio container for the snapshot element.
 */
snapshots.generateSnapshotRadio = function(id, description, coverImage, doHr) {
  var container = document.createElement('span');
  var radioSnapshot = document.createElement('input');
  radioSnapshot.type = 'radio';
  radioSnapshot.name = 'snapshot';
  radioSnapshot.id = id;
  radioSnapshot.onclick = function() {
    snapshots.toggleSnapshot(utilities.escapeQuotes(id));
  };
  container.appendChild(radioSnapshot);

  container.appendChild(document.createElement('br'));

  var textTag = document.createElement('span');
  textTag.innerText = description;
  container.appendChild(textTag);

  var imageElement = document.createElement('img');
  imageElement.src = coverImage.url;
  container.appendChild(imageElement);

  if (doHr) {
    container.appendChild(document.createElement('hr'));
  }
  return container;
};


/**
 * Toggles the currently selected radio button on and all others off.
 *
 * @param {string} id The element ID for the selected button.
 */
snapshots.toggleSnapshot = function(id) {
  for (var i = 0; i < currSnapshotIds.length; i++) {
    if (currSnapshotIds[i] != id) {
      document.getElementById(currSnapshotIds[i]).checked = false;
    }
  }
  document.getElementById('selectedSnapshot').value = id;
};


/**
 * Lists the snapshots for the given player and passes the results to the
 * callback.
 *
 * @param {string} playerId The identifier for the player to get snapshots for.
 * @param {function} callback The function to pass the result data to.
 */
snapshots.listSnapshots = function(playerId, callback) {
  if (!playerId) {
    playerId = 'me';
  }
  if (!callback) {
    callback = function(resp) {
      console.log(resp);
    };
  }
  gapi.client.games.snapshots.list({playerId: 'me'}).execute(callback);
};


/**
 * Retrieves the snapshot data for the snapshot id in the input field.
 */
snapshots.peekCurrentSnapshot = function() {
  var snapshotId = document.getElementById('selectedSnapshot').value;
  console.log('Loading data for ' + snapshotId);
  gapi.client.games.snapshots.get({snapshotId: snapshotId}).execute(
      function(resp) {
        console.log(resp);
        lastSnapshot = resp;
        snapshots.peekSnapshotData(resp.driveId);
      }
  );
};


/**
 * Looks at snapshot data.
 *
 * @param {string} driveId The Drive identifier for the snapshot to peek at.
 */
snapshots.peekSnapshotData = function(driveId) {
  var callback = function(resp) {
    snapshots.lastSnapshot = resp;

    var root = document.getElementById('snapshotEditArea');
    root.innerHTML = '';

    var tempElement = document.createElement('h3');
    tempElement.innerText = 'Raw Snapshot Metadata';
    root.appendChild(tempElement);

    tempElement = utilities.createTextArea(undefined, '600px', '800px',
        JSON.stringify(resp.result));
    root.appendChild(tempElement);

    var innerCallback = function(ss) {
      var innerElement = document.createElement('h3');
      innerElement.innerText = 'Snapshot Edit Area';
      root.appendChild(innerElement);

      root.appendChild(document.createElement('br'));

      innerElement = utilities.createTextArea('ssRawData', '600px', '400px',
          ss);
      root.appendChild(innerElement);
    };
    snapshots.downloadFile(resp, innerCallback);
  };

  gapi.client.drive.files.get({fileId: driveId}).execute(
      function(ss) {
        callback(ss);
      });
};


/**
 * Modifies snapshot data.
 */
snapshots.pokeCurrentSnapshot = function() {
  snapshots.uploadSnapshot();
};


/**
 * Callback function that uploads metadata for a snapshot.
 *
 * @param {function} callback The function to call when the callback completes.
 */
snapshots.uploadSnapshot = function(callback) {
  var contentType = 'application/octet-stream';
  var boundary = '-------374159275358879320846';
  var delimiter = '\r\n--' + boundary + '\r\n';
  var close_delim = '\r\n--' + boundary + '--';

  console.log('Writing snapshot: ');
  console.log(snapshots.lastSnapshot);

  // Update the description in the snapshot metadata.
  snapshots.lastSnapshot.description = 'Modified data at: ' + new Date();

  var base64Data = btoa(document.getElementById('ssRawData').value);
  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(snapshots.lastSnapshot) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delim;

  var request = gapi.client.request({
    'path': '/upload/drive/v2/files/' + snapshots.lastSnapshot.id,
    'method': 'PUT',
    'params': {'uploadType': 'multipart', 'alt': 'json'},
    'headers': {
      'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
    },
    'body': multipartRequestBody});
  if (!callback) {
    callback = function(file) {
      console.log(file);
    };
  }
  request.execute(callback);
};


/**
 * Download a Drive file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
snapshots.downloadFile = function(file, callback) {
  console.log(file);
  if (file.downloadUrl) {
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file.downloadUrl);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
      callback(xhr.responseText);
    };
    xhr.onerror = function() {
      callback(null);
    };
    xhr.send();
  } else {
    callback(null);
  }
};
