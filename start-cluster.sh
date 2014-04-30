#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# nohup node ~/tc-api/node_modules/.bin/actionHero start 2>&1 &
forever start -d -v -a -l "${DIR}/log/forever.log" "${DIR}/node_modules/actionhero/bin/actionhero" startCluster --workers=1
