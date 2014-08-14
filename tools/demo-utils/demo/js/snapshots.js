var drive = drive || {};
var lastSnapshot = {};

/**
 * List snapshots for the current user.
 */
function listSnapshots(playerId, callback) {
  if (!playerId){
    playerId = 'me';
  }
  if (!callback){
    callback = function(resp){
      console.log(resp);
    }
  }
  gapi.client.games.snapshots.list({playerId: }).execute(callback)
}

/**
 * Looks at snapshot data.
 */
function peekSnapshot() {
}

/**
 * Modifies snapshot data.
 */
function pokeSnapshot() {
}

/**
 * Download a Drive file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
drive.downloadFile = function (file, callback) {
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
