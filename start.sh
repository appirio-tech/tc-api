#!/bin/bash

# nohup node ~/tc-api/node_modules/.bin/actionHero start 2>&1 &
forever start -f -a -l ~/tc-api/log/forever.log ~/tc-api/node_modules/actionHero/bin/actionHero start
