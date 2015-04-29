#!/bin/bash
ACTION=$1
SIGNAL=""

pid=$(ps ax | grep startCluster | grep -v grep | xargs | cut -f1 -d' ')
if [ "$pid" == "" ]; then 
	echo "No cluster master process found."
	exit
fi

function workers_ps {
	ps_out=$(ps ax | grep -- "actionhero start$" | grep -v grep)
	IFS='
	'
	IFS=${IFS:0:1}
	workers=( $ps_out )
	}

workers_ps

wpids=()
for worker in "${workers[@]}"
do
	wpids+=("$(echo -e "${worker}" | xargs | cut -f1 -d' ')")
done


if [ "$ACTION" == "reload" ]; then
	SIGNAL="HUP"
elif [ "$ACTION" == "add" ]; then
	SIGNAL="TTIN"
elif [ "$ACTION" == "rm" ]; then
	SIGNAL="TTOU"
elif [ "$ACTION" == "kill" ]; then
	for wpid in "${wpids[@]}"
	do
        kill -9 $wpid # kill the workers and let master restart
	done
	exit
elif [ "$ACTION" == "recycle" ]; then
	numWorkers=${#wpids[@]}
	echo "Start Recycle, Workers Running: ${#workers[@]}"

	for wpid in "${wpids[@]}"
	do
        kill -TTIN $pid # add one
        sleep 1
	done

	declare -i sleepTime
	sleepTime=$numWorkers*2
	sleep $sleepTime
	
	workers_ps
	echo "Max Workers Running: ${#workers[@]}"

	# signal recycle of all
	kill -HUP $pid

	sleepTime=$numWorkers*2
	sleep $sleepTime

	for wpid in "${wpids[@]}"
	do
        kill -TTOU $pid # remove one
        sleep 1
	done

	sleep $sleepTime

	workers_ps
	echo "End Recycle, Workers Running: ${#workers[@]}"
	exit
elif [ "$ACTION" == "ls" ]; then
	for worker in "${workers[@]}"
	do
		echo -e "${worker}" | xargs | cut -f1,4 -d' '
	done
	echo "Count: ${#wpids[@]}" 
	exit
elif [ "$ACTION" == "count" ]; then
    echo "${#wpids[@]}"
	exit
elif [ "$ACTION" == "double" ]; then
    for wpid in "${wpids[@]}"
	do
        kill -TTIN $pid # add one
        sleep 1
	done
	exit
elif [ "$ACTION" == "halve" ]; then
    for ((i = 0 ; i < ${#wpids[@]}/2 ; i++ ))
	do
        kill -TTOU $pid # remove one
        sleep 1
	done
	exit
elif [ "$ACTION" == "debug" ]; then
	kill -USR1 $2
	exit
else
	echo "Usage: workers.sh [reload|recycle|add|rm|ls|count]"
	exit
fi

kill -$SIGNAL $pid
echo "Signal $SIGNAL sent to process: $pid" 
