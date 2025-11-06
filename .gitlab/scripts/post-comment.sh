#!/usr/bin/env bash
set -euo pipefail

echo "💬 Preparing to post or update comment..."

# Construct the MR notes API URL
MR_NOTES_URL="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes"

# Find existing comment with the feedback marker
EXISTING_NOTE_ID=$(curl --silent --show-error --insecure \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "${MR_NOTES_URL}" \
  | "${GITLAB_SCRIPTS_DIR}/jq" -r '.[] | select(.body | contains("<!-- changeset-feedback -->")) | .id' \
  | head -n 1 || true)

# Read and escape the new comment body safely
if [ ! -f mr-comment.md ]; then
  echo "❌ mr-comment.md not found!"
  exit 1
fi

COMMENT_BODY=$("${GITLAB_SCRIPTS_DIR}/jq" -Rs . < mr-comment.md)

# Post or update the comment
if [ -n "${EXISTING_NOTE_ID:-}" ]; then
  echo "📝 Updating existing comment (ID: ${EXISTING_NOTE_ID})..."
  curl --fail --silent --show-error --insecure --request PUT \
    --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"body\": ${COMMENT_BODY}}" \
    "${MR_NOTES_URL}/${EXISTING_NOTE_ID}"
else
  echo "💬 Creating new comment..."
  curl --fail --silent --show-error --insecure --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"body\": ${COMMENT_BODY}}" \
    "${MR_NOTES_URL}"
fi

echo "\n✅ Comment posted successfully!"
