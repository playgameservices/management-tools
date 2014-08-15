var snapshot = snapshot || {};
var drive = drive || {};
var lastSnapshot = {};

drive.DRIVE_HOST_PATH = 'https://googledrive.com/host/';
drive.HOST_FOLDER = "snapshotImages";
// TODO (class) Use namespace and make state members internal.

/**
 * List snapshots for the current user.
 */
function updateSnapshotList(){
  var callback = function (resp){
    console.log(resp);
    var content = '';
    for (var i = 0; i < resp.items.length; i++){
      content += '<paper-radio-button ' +
          'onClick="document.getElementById(\'selectedSnapshot\').value =\'' +
          resp.items[i].id + '\';"></paper-radio-button> &nbsp;' +
          resp.items[i].description + '<p>';
    }
    content += '</ul>';
    document.getElementById('snapshotsListArea').innerHTML = content;
  };

  snapshot.listSnapshots('me', callback);
}


/**
 * Lists the snapshots for the given player and passes the results to the
 * callback.
 *
 * @param {string} playerId The identifier for the player to get snapshots for.
 * @param {function} callback The function to pass the result data to.
 */
snapshot.listSnapshots = function (playerId, callback) {
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
snapshot.peekCurrentSnapshot = function(){
  var snapshotId = document.getElementById('selectedSnapshot').value;
  console.log('Loading data for ' + snapshotId);
  gapi.client.games.snapshots.get({snapshotId: snapshotId}).execute(
    function(resp){
      console.log(resp);
      snapshot.peekSnapshotData(resp.driveId);
    }
  );
};


/**
 * Looks at snapshot data.
 *
 * @param {string} snapshotId The identifier for the snapshot to peek at.
 */
snapshot.peekSnapshotData = function (driveId) {
  var callback = function(resp){
    console.log(resp);
    document.getElementById('snapshotEditArea').innerHTML =
      '<h3>Raw Snapshot Metadata</h3><br>' +
      '<textarea style="width:600px; height: 800px;">' +
      JSON.stringify(resp.result, undefined, 2) + '</textarea><hr>';

    var innerCallback = function(ss) {
      document.getElementById('snapshotEditArea').innerHTML +=
        '<h3>Raw Snapshot Data</h3><br>' +
        '<textarea style="width: 600px; height 400px;">' + ss + '</textarea>';
    }
    drive.downloadFile(resp, innerCallback);
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
function pokeCurrentSnapshot() {
}


/**
 * Updates the model with the current snapshot data.
 */
snapshot.updateLastSnapshot = function(snapshotId){
  gapi.client.games.snapshots.get({snapshotId:snapshotId}).execute(
      function(snapshot) {
        snapshot.lastSnapshot = snapshot;
      }
  );
}

/**
 * Finds and saves the snapshot.
 */
snapshot.findSnapshot = function(){
  // TODO: show conflicts
  // Find the snapshot save file
  gapi.client.drive.files.list(
    {q:'title = "' + model.lastSnapshot.title + '" and mimeType = ' +
        '"application/vnd.google-play-games.snapshot"'}).
      execute(function(r){console.log(r)});
}


/**
 * Download a Drive file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
drive.downloadFile = function (file, callback) {
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
