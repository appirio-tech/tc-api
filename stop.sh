#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

forever stop "${DIR}/node_modules/actionhero/bin/actionhero"
