// @ts-check

// /**
//  * @type {import("@changesets/types").CommitFunctions["getAddMessage"]}
//  */
// const getAddMessage = async changeset => {
//   return `docs(changeset): ${changeset.summary}`;
// };

/**
 * @type {import("@changesets/types").CommitFunctions["getVersionMessage"]}
 */
const getVersionMessage = async releasePlan => {
  const publishableReleases = releasePlan.releases.filter(
    release => release.type !== 'none',
  );
  const numPackagesReleased = publishableReleases.length;

  const releasesLines = publishableReleases
    .map(release => `  ${release.type}: ${release.name}@${release.newVersion}`)
    .join('\n');

  return `chore(release): releasing ${numPackagesReleased} package(s)

Releases:
${releasesLines}
\n[skip ci]\n`;
};

module.exports = {
  getAddMessage: false,
  getVersionMessage,
};
