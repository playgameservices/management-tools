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

snapshots.lastSnapshot = {};

drive.DRIVE_HOST_PATH = 'https://googledrive.com/host/';
drive.HOST_FOLDER = "snapshotImages";
// TODO (class) Use namespace and make state members internal.


/**
 * List snapshots for the current user.
 */
snapshots.updateSnapshotList = function (){
  var callback = function (resp){
    console.log(resp);
    var content = '<form>';
    if (resp.items){
      currSnapshotIds = [];
      for (var i = 0; i < resp.items.length; i++){
        currSnapshotIds[currSnapshotIds.length] = resp.items[i].id;
        content += '<paper-radio-button toggles="true" id="' +
            resp.items[i].id + '" ' +
            'onClick="snapshots.toggleSnapshot(\'' +
            resp.items[i].id + '\');"></paper-radio-button> &nbsp;' +
            resp.items[i].description + '<p><img src="' +
            resp.items[i].coverImage.url + '"></img>' +
            ((i < (resp.items.length - 1)) ? '<hr>' : '');
      }
    }
    content += '</form>';
    document.getElementById('snapshotsListArea').innerHTML = content;
  };

  snapshots.listSnapshots('me', callback);
}


/**
 * Toggles the currently selected radio button on and all others off.
 *
 * @param {string} id The element ID for the selected button.
 */
snapshots.toggleSnapshot = function (id){
  for (var i=0; i < currSnapshotIds.length; i++){
    if (currSnapshotIds[i] != id){
      document.getElementById(currSnapshotIds[i]).checked = false;
    }
  }
  document.getElementById('selectedSnapshot').value = id;
}


/**
 * Lists the snapshots for the given player and passes the results to the
 * callback.
 *
 * @param {string} playerId The identifier for the player to get snapshots for.
 * @param {function} callback The function to pass the result data to.
 */
snapshots.listSnapshots = function (playerId, callback) {
  if (!playerId){
    playerId = 'me';
  }
  if (!callback){
    callback = function(resp){
      console.log(resp);
    }
  }
  gapi.client.games.snapshots.list({playerId: 'me'}).execute(callback)
}


/**
 * Retrieves the snapshot data for the snapshot id in the input field.
 */
snapshots.peekCurrentSnapshot = function(){
  var snapshotId = document.getElementById('selectedSnapshot').value;
  console.log('Loading data for ' + snapshotId);
  gapi.client.games.snapshots.get({snapshotId: snapshotId}).execute(
    function(resp){
      console.log(resp);
      lastSnapshot = resp;
      snapshots.peekSnapshotData(resp.driveId);
    }
  );
};


/**
 * Looks at snapshot data.
 *
 * @param {string} snapshotId The identifier for the snapshot to peek at.
 */
snapshots.peekSnapshotData = function (driveId) {
  var callback = function(resp){
    document.getElementById('snapshotEditArea').innerHTML =
      '<h3>Raw Snapshot Metadata</h3><br>' +
      '<textarea style="width:600px; height: 800px;">' +
      JSON.stringify(resp.result, undefined, 2) + '</textarea><hr>';
    snapshots.lastSnapshot = resp;

    var innerCallback = function(ss) {
      document.getElementById('snapshotEditArea').innerHTML +=
        '<h3>Raw Snapshot Data</h3><br>' +
        '<textarea id="ssRawData" style="width: 600px; height 400px;">' +
        ss + '</textarea>';
    }
    snapshots.downloadFile(resp, innerCallback);
  };

  gapi.client.drive.files.get({fileId: driveId}).execute(
    function(ss){
      callback(ss);
    });
};


/**
 * Modifies snapshot data.
 *
 * @param {string} snapshotId The identifier for the snapshot to modify.
 */
snapshots.pokeCurrentSnapshot = function() {
  snapshots.uploadSnapshot();
}


/**
 * Callback function that uploads metadata for a snapshot.
 */
snapshots.uploadSnapshot = function(callback) {
  var contentType = 'application/octet-stream';
  var boundary = '-------374159275358879320846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  console.log("Writing snapshot: ");
  console.log(snapshots.lastSnapshot);

  // Update the description in the snapshot metadata.
  //lastSnapshot.coverImage.url = imageFile.webContentLink;
  snapshot.lastSnapshot.description = 'Modified data at: ' + new Date();

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
      console.log(file)
    };
  }
  request.execute(callback);
};


/**
 * Finds open conflicts for a snapshot.
 *
 * @param {String} snapshotTitle The snapshot title to find conflicts for.
 */
snapshots.findSnapshotConflicts = function(snapshotTitle){
  // TODO (class) show conflicts
  // Find the snapshot save file
  gapi.client.drive.files.list(
    {q:'title = "' + snapshotTitle + '" and mimeType = ' +
        '"application/vnd.google-play-games.snapshot"'}).
      execute(function(r){console.log(r)});
}


/**
 * Download a Drive file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
snapshots.downloadFile = function (file, callback) {
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
}
