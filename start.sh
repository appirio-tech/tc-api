#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -a deploy/env.sh ]; then
	. deploy/env.sh
fi

forever start -d -v -a -l "${DIR}/log/forever.log" "${DIR}/node_modules/actionhero/bin/actionhero" start
#forever start -d -a -l "${DIR}/log/forever.log" "${DIR}/node_modules/actionhero/bin/actionhero" startCluster --workers=10
