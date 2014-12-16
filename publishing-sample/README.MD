# Games services publishing sample
_Copyright (c) 2014 Google Inc. All rights reserved._

This sample is exposes the [Google Play Game services publishing API](https://developers.google.com/games/services/publishing/quickstart) as a command line tool.The listing, creation, updating and deletion of 
achievements and leaderboards is supported, as well as uploading images
for them.  The authentication can be done via web based OAuth flow,
or by using a service account certificate in a .p12 file.  The input for
creating and updating achievements and leaderboards is a CSV file.
The sample code converts the CSV file into the JSON representation required
by the API.


## Prerequisites
To run this sample you need:
* Python version 2.7+.
* Google Client API.
  In to install this run:
    `pip install --upgrade google-api-python-client`

Usage information can be viewed by running
  `python games-config.py --help`



## Achievements

### List the achievements for a game

`python games-config.py achievement list <appId>`
where *<appId>* is the numeric application id for your game.

The output is  comma separated values (csv) where is one row for each achievement/locale pair.  The published data is not shown by default, but can be included by adding the _--incPublished_  option.


### Get a single achievement

`python games-config.py achievement get <achievementId>`

__Note: that the id is the achievement ID, not the application.__


### Update achievements

1. Retrieve the existing achievement list:
  `python games-config.py achievement list <appId> --outcsv ach_data.csv`
2. Modify the contents of the file
3. Run the update command
  `python games-config.py achievement update --incsv ach_data.csv`


### Delete an achievement

`python games-config.py achievement delete <achievementId>`


## Leaderboards

### List the leaderboards for a game

`python games-config.py leaderboard list <appId>`
where _<appId>_ is the numeric application id for your game.

The output is  comma separated values (csv) where is one row for each achievement/locale pair.  The published data is not shown by default, but can be included by adding the _--incPublished_  option.


### Get a single leaderboard

`python games-config.py leaderboard get <leaderboardId>`

__Note: that the id is the leaderboard ID, not the application.__


### Update leaderboard

1. Retrieve the existing achievement list:
  `python games-config.py leaderboard list <appId> --outcsv lb.csv`
2. Modify the contents of the file
3. Run the update command
  `python games-config.py leaderboard update --incsv lb.csv`

### Delete a leaderboard

`python games-config.py leaderboard delete <leaderboardId>`

## Image upload

Images for achievements and leaderboards can be uploaded using:
`python games-config.py achievement image <achievementId> --image <filename>`

or

`python games-config.py leaderboard image <leaderboardId> --image <filename>`

The images must comply with the requirements outlined in [Icon guidelines](https://developers.google.com/games/services/common/concepts/achievements#icon_guidelines).




