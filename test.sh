#!/bin/bash
rm -rf test/test_*.log

for i in 1 2 3 4 5 6
do
    ./node_modules/.bin/mocha test/testAsync.js &> test/test_files/test_$i.log &
done

echo "Started"

