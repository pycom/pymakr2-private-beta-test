const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const gitToken = core.getInput('git-token') || process.env.GITHUB_TOKEN;
const octokit = new github.GitHub(gitToken);
const shell = require('node-powershell');

const repo = {
  owner: 'atom',
  repo: 'atom',
};

const ps = new shell({
  executionPolicy: 'Bypass',
  noProfile: true,
});
const fetchElectronVersion = async (tag) => {
  try {
    // Fetch package.json file (contains electron target)
    const response = await axios.get(
      `https://raw.githubusercontent.com/atom/atom/${tag}/package.json`,
    );
    const version = response.data.electronVersion.toString();
    core.info(`Atom ${tag} uses Electron v${version}`);
    return version;
  } catch (e) {
    throw e;
  }
};

// gets binaries for current and nightly Atom version
const getBinaries = async () => {
  const tags = (
    await octokit.repos.listTags({
      ...repo,
      per_page: 50,
    })
  ).data.map((item) => item.name);

  const atomNightlyTag = tags[0];
  const atomCurrentTag = 'master';
  const atomNightlyElectron = await fetchElectronVersion(atomNightlyTag);
  const atomCurrentElectron = await fetchElectronVersion(atomCurrentTag);
  const electronVersions = [];
  electronVersions.push(atomCurrentElectron);
  if (atomCurrentElectron != atomNightlyElectron) electronVersions.push(atomNightlyElectron);
  console.log('\n');
  console.log(`Downloading binaries for ${electronVersions.join(', ')}`);
  ps.addCommand(
    '/Users/pk/dev/pycom/pymakr-atom/scripts/mp-download-atom.ps1',
    [{ ElectronVersions: electronVersions }],
  );

  ps.invoke()
    .then((output) => {
      console.log(output);
      ps.dispose();
    })
    .catch((err) => {
      console.log(err);
      ps.dispose();
    });
};

getBinaries();
