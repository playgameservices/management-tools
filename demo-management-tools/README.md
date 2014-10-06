# Google Play Games Services Management Demo #

This demo console shows you how to use the Google Play Games Management API to
manage and test Google Play Games Features.

## Installation ##
The sample uses [Bower](http://bower.io/) and
[Polymer](http://www.polymer-project.org/) to simplify the UI and dependencies
of the project.

For Bower, you need to install [Node.js](http://nodejs.org/). After node is
installed, install the Bower package by calling:

`npm install -g bower`

After Bower is installed, you are ready to update the project dependencies with
Bower by running:

`bower install`

With the dependencies set, serve the demo-utils folder from a web server. For
example, you can use the Python Simple HTTP server module by running:

`python -m SimpleHTTPServer [port]`

With the web server running, navigate to /demo/demo.html and you should see
the sample load.

## Configuration ##
First, create a client ID for Web applications from the [Google Play Developer
Console](https://play.google.com/apps/publish) within the project that you
want to manage.

Replace `YOUR_CLIENT_ID` in demo.html with your app's client ID and also replace
`YOUR_APP_ID` in `js/constants.js` with the app ID for your Games Services ID
from the Google Play Developer Console.

## Using the sample ##
When you open the sample, you will notice four tabs:

1. Achievements
2. Leaderboards
3. Events/Quests
4. Snapshots

Each of these tabs corresponds to the Play Games Services features associated
with that feature area.

### Achievements ###
From this page, you can:
* Unlock achievements
* Increment achievement counts
* Reset achievements
* Reset all achievements

This is useful for when you want to simulate the achievement features of your
game.

### Leaderboards ###
From this page you can:

* Check leaderboards
* Show high scores for leaderboards
* Show / hide players
* Submit high scores to leaderboards
* Reset player scores on leaderboards

This is both useful for testing and for managing scores for test accounts or
hiding players who are cheating.

### Events/Quests ###
From this page, you can:
* List events
* List quests
* Simulate events
* Accept quests
* Reset quests
* Reset events for quests

This is useful for testing your quests before you publish without having to
actually play through or complete the quests.

### Snapshots ###
From this page, you can
* List snapshots
* Look at snapshot data
* Alter data within snapshots

This is useful for testing your snapshot data.

**Note** Writing snapshot data from the Web API is experimental and should not
be done on production data.
