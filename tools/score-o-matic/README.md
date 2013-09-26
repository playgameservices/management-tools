## The Play Games Hide-O-matic!

This utility will allow you to arbitrarily submit and reset scores on
a given leaderboard for your application.

Testing leaderboards?  Need more data?  Sign in to this application and
set your scores arbitrarily.  Once you have a score, if you are a
tester on the Developer Console, you can use the management API to
reset your score.

More information at:

https://developers.google.com/games/services/management/api/index

## Setup and usage

Open index.html in your browser and follow the directions.  

To summarize:

   * Host these pages somewhere, even localhost.

   * If you haven't already done so, link a web app in the
Developer Console.  Make one of the javascript origins whereever
you're hosting this (such as http://localhost).

   * Replace CLIENT_ID, APP_ID, and LEADERBOARD_ID in these two files
with appropriate values from the Developer Console.

   * Reload index.html and log in with the app owner's account (or
account with owner permissions).

   * Refresh your leaderboard list.

   * Pick a leaderboard and refresh the scores.

   * You can then set your score, or reset it.  You'll need to 
refresh your scores to see the change.

   * When you're finished, if you've used localhost as your javascript
origin, you'll want to remove it in the Google APIs console.

Last edited: 2013/9/25