#!/bin/bash

OLD_SCOPE=$1
NEW_SCOPE=$2

if [ -z "$OLD_SCOPE" ] || [ -z "$NEW_SCOPE" ]; then
  echo "❌ Usage: $0 <old-scope> <new-scope>"
  echo "   Example: $0 compass appdev"
  exit 1
fi

# FULL_SCOPE="@${SCOPE}"
OLD_PREFIX="@${OLD_SCOPE}/backstage-plugin-"
NEW_PREFIX="@${NEW_SCOPE}/backstage-plugin-"

echo "🔧 Patching $OLD_PREFIX → $NEW_PREFIX..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  SED_COMMAND="sed -i ''"
else
  # Linux
  SED_COMMAND="sed -i"
fi

# Run sed using the appropriate command
grep -rl --exclude-dir={node_modules,.git} --exclude=CHANGELOG.md "$OLD_PREFIX" plugins/ packages/ |
  xargs -I {} $SED_COMMAND "s|$OLD_PREFIX|$NEW_PREFIX|g" {}

# Updaing references in node_modules and yarn.lock
echo "📦 Updating yarn cache..."
yarn install --silent >/dev/null 2>&1

echo "🧹 Running Backstage repo fix..."
yarn backstage-cli repo fix --publish >/dev/null 2>&1

echo "✅ Done patching for scope: $NEW_PREFIX"
