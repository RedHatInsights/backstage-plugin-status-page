/**
 * @type {require('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: 'main',
  ignorePrivatePackages: true,
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalCommits',
        releaseRules: [
          {
            type: 'docs',
            release: 'patch',
          },
          {
            type: 'refactor',
            release: 'patch',
          },
          {
            type: 'perf',
            release: 'minor',
          },
          {
            type: 'no-release',
            release: false,
          },
          {
            type: 'chore',
            release: 'patch',
          },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalCommits',
        presetConfig: {
          types: [
            {
              type: 'feat',
              section: 'Features',
            },
            {
              type: 'fix',
              section: 'Bug Fixes',
            },
            {
              type: 'docs',
              section: 'Documentation',
            },
            {
              type: 'style',
              section: 'Other changes',
            },
            {
              type: 'refactor',
              section: 'Other changes',
            },
            {
              type: 'perf',
              section: 'Other changes',
            },
            {
              type: 'test',
              section: 'Other changes',
            },
            {
              type: 'chore',
              section: 'Other changes',
            },
          ],
        },
        writerOpts: {
          commitsSort: ['subject', 'scope'],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogTitle: '# Changelog',
      },
    ],
    '@semrel-extra/npm',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
      },
    ],
  ],
};
