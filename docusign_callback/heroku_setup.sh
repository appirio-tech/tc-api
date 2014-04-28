echo "INFO: Creating git repository"
git init
git add .
git commit -m 'auto commit'

echo "INFO: Creating heroku"
heroku create

echo "INFO: Set environment variables on heroku"
heroku labs:enable user-env-compile
heroku config:set DOCUSIGN_CALLBACK_ENDPOINT=$DOCUSIGN_CALLBACK_ENDPOINT

echo "INFO: Push application to heroku and start"
git push heroku master
heroku ps:scale web=1
