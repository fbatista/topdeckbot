# topdeckbot
A discord bot to run swiss method tournaments, based on the MTG approach.
Using discord.js library.

Uses the Monrad approach for pairings.
Uses the following tiebreakers, in order:

- Match points
- Opponent Match Win %
- Game Win %
- Opponent Game Win %
- Random

Supports byes.

## Instalation

You will need node 13+;

- Create a Discord app, add a bot to it, grab the token and add the bot to your server - https://discordjs.guide/preparations/setting-up-a-bot-application.html
- Copy the config.json.example into a config.json and edit it to setup your token.
- install dependencies via `npm install`
- run the bot via the command line with `node index.json`
- Make sure at least one admin has the Staff role (the bot creates this role if it doesn't exist)

## Commands

`!checkin` - start a tournament (Staff only).

`!join` - join the tournament.

`!start` - finish the checkin and start the tournament - outputs pairings for round 1 (Staff only).

`!result w-l-d` - submit a result to the bot, example: `!result 2-0` - these are confirmed via thumbs up reactions by the opponent.

`!next` - advance the tournament to the next round. If there's no more rounds left, outputs the final standings.

`!standings` - check the current standings.
