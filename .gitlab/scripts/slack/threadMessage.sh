#!/bin/bash
alias jq="$GITLAB_SCRIPTS_DIR/jq"

esc() {
    printf "%s" "$1" | sed -e 's/"/\\"/g'
}

MESSAGE=$1

jq_script=".channel = \"$SLACK_CHANNEL\""
jq_script+="| .thread_ts = \"$SLACK_TIMESTAMP\""
jq_script+="| .attachments[0].blocks[0].elements[0].text = \"$(esc "$MESSAGE")\""

if [ ! -z "$FAILURE_MESSAGE" ]
then
    jq_script+="| .reply_broadcast = true"
fi

SLACK_PAYLOAD="$TEMP_DIR/threadMessage.json"
SLACK_RESPONSE="$TEMP_DIR/threadResponse.json"

jq "$jq_script" $GITLAB_TEMPLATES_DIR/slack/threadMessage.json > "$SLACK_PAYLOAD"

curl -s -H "Content-type: application/json; charset=utf-8" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -X POST \
    -d "@$SLACK_PAYLOAD" \
    -o "$SLACK_RESPONSE" \
    "https://slack.com/api/chat.postMessage"