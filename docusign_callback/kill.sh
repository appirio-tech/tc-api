procId=$(ps aux | grep 'node docusignCallbackListener.js' | grep -v grep | awk '{print $2}')
echo "killing $procId"
kill -9 $procId
