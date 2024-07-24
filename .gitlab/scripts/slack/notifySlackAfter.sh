#!/bin/bash
if [ "$SLACK_SKIP" == 'true' ]
then
    exit 0
fi

if [ "$CI_COMMIT_BRANCH" == "$CI_DEFAULT_BRANCH" ]
then 
    if [ $CI_JOB_STATUS == 'failed' ]
    then
        export THREAD_MESSAGE="Alert: Backstage Plugins Pipeline Failure!\nStage Name: ${CI_JOB_STAGE}\nJob Name: ${CI_JOB_NAME} at ${CI_JOB_STARTED_AT} \nFailed Job URL: ${CI_JOB_URL}"
        if [ ! -z "$THREAD_MESSAGE" ] 
        then
            sh $GITLAB_SCRIPTS_DIR/slack/threadMessage.sh "$THREAD_MESSAGE"
        fi
    fi
fi