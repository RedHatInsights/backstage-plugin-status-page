#!/usr/bin/env node
let fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('.changeset/status.json', 'utf8'));
  const releases = data.releases.filter(r => r.oldVersion !== r.newVersion);

  let output = '<!-- changeset-feedback -->\n';

  if (releases.length > 0) {
    output +=
      '### 🦋 Packages to be released\n\n' +
      '| Package Name | Bump Type | Current Version | Release Version |\n' +
      '|---------------|------------|-----------------|-----------------|\n';

    for (const r of releases) {
      output += `| ${r.name} | ${r.type} | ${r.oldVersion} | ${r.newVersion} |\n`;
    }
  } else {
    output += '✅ No packages will be released.\n\n';
    output += '💡 To include your package in the next release, run `yarn changeset` and follow the prompts.';
  }

  fs.writeFileSync('mr-comment.md', output);
  console.log('✅ Generated mr-comment.md successfully.');
} catch (err) {
  console.error('❌ Failed to generate feedback:', err);
  process.exit(1);
}
