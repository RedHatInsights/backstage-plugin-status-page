#!/usr/bin/node

import { execSync } from 'node:child_process';
import fs from 'fs';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

console.log('🔍 Detecting changed packages via Changesets...');
run('yarn changeset status --output .changeset/status.json');
const { releases } = JSON.parse(
  fs.readFileSync('.changeset/status.json', 'utf8'),
);

if (!releases.length) {
  console.log('✅ No changed packages to publish.');
  process.exit(0);
}

console.log('📦 Packages to publish:');
for (const r of releases) {
  console.log(` - ${r.name}@${r.newVersion}`);
}

console.log('🧩 Running changeset version...');
run('yarn changeset version');
console.log('✅ Committed version bump changes');

for (const r of releases) {
  if (r.oldVersion !== r.newVersion) {
    const tag = `${r.name}@${r.newVersion}`;
    console.log(`🚀 Publishing ${tag}...`);

    try {
      run(`yarn workspace ${r.name} npm publish --tolerate-republish`);
      console.log(`✅ Published ${tag}`);

      run(`git tag -a ${tag} -m "Release ${tag}"`);
      console.log(`🏷️ Created tag ${tag}`);
    } catch (err) {
      console.error(`❌ Failed to publish ${r.name}:`, err.message);
    }
  }
}
