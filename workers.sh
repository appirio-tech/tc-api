#!/bin/bash
ACTION=$1
SIGNAL=""

if [ "$ACTION" == "reload" ]; then
	SIGNAL="HUP"
elif [ "$ACTION" == "add" ]; then
	SIGNAL="TTIN"
elif [ "$ACTION" == "rm" ]; then
	SIGNAL="TTOU"
fi

if [ "$SIGNAL" == "" ]; then
	echo "Usage: workers.sh [reload|add|rm]"
else
	pid=$(ps ax | grep startCluster | grep -v grep | xargs | cut -f1 -d' ')
	if [ "$pid" == "" ]; then echo "No cluster master process found."
	else
		kill -$SIGNAL $pid
		echo "Signal $SIGNAL sent to process: $pid" 
	fi
fi