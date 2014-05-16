#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# nohup node ~/tc-api/node_modules/.bin/actionHero start 2>&1 &
"${DIR}/node_modules/actionhero/bin/actionhero" startCluster --workers=1 --daemon
