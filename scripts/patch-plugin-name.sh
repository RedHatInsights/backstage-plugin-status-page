#!/bin/bash

# Disabling this script
echo "The script is disabled to avoid any unnecessary changes"
exit 1

SCOPE=$1

if [ -z "$SCOPE" ]; then
  echo "❌ Please provide a scope (e.g., compass, appdev)"
  exit 1
fi

FULL_SCOPE="@${SCOPE}"
OLD_PREFIX="${FULL_SCOPE}/backstage-plugin-"
NEW_PREFIX="${FULL_SCOPE}/plugin-"

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
grep -rl --exclude-dir={node_modules,.git} "$OLD_PREFIX" plugins/ packages/ |
  xargs -I {} $SED_COMMAND "s|$OLD_PREFIX|$NEW_PREFIX|g" {}

# Updaing references in node_modules and yarn.lock
echo "📦 Updating yarn cache..."
yarn install --silent >/dev/null 2>&1

echo "🧹 Running Backstage repo fix..."
yarn backstage-cli repo fix --publish >/dev/null 2>&1

echo "✅ Done patching for scope: $FULL_SCOPE"
