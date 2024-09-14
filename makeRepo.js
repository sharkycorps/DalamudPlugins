const fs = require('fs');
const path = require('path');
const jsToml = require('js-toml');
const moment = require('moment');

const pluginsRoot = 'plugins';
const downloadRoot = `https://raw.githubusercontent.com/${ process.env.GITHUB_REPOSITORY }/main/plugins`;

// 读取并解析 manifest 文件
function readManifest(name) {
  const manifestPath = path.join(pluginsRoot, `stable/${name}/${name}.json`);
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(manifestContent);
}

// 主函数
(async () => {

  // 读取并解析 State.toml 文件
  const stateTomlPath = path.join(pluginsRoot, 'State.toml');
  const stateTomlContent = fs.readFileSync(stateTomlPath, 'utf-8');
  const config = jsToml.load(stateTomlContent);
  
  let pluginNames = [];

  for (const [channel, plugins] of Object.entries(config.channels)) {
    for (const [pluginName, pluginData] of Object.entries(plugins.plugins)) {
      const timeBuiltRaw = pluginData.time_built;
      const timeBuilt = moment(timeBuiltRaw, moment.ISO_8601).utc();

      pluginNames.push({
        name: pluginName,
        timeBuilt
      });
    }
  }

  let pluginList = [];

  for (const plugin of pluginNames) {
    let manifest;
    try {
      manifest = readManifest(plugin.name);
    } catch (error) {
      console.log('Could not parse plugin manifest.');
      continue;
    }

    manifest.last_update = Math.floor(plugin.timeBuilt.valueOf() / 1000);
    manifest.download_link_install = `${ downloadRoot }/stable/${ plugin.name }/latest.zip`;
    // TODO: these aren't supposed to be the same
    manifest.download_link_testing = manifest.download_link_install;
    manifest.download_link_update = manifest.download_link_install;

    manifest.download_count = 0;
    manifest.is_dip17_plugin = true;
    manifest.dip17_channel = 'stable';

    pluginList.push(manifest);
  }

  fs.writeFileSync('repo.json', JSON.stringify(pluginList, null, 2));

  console.log('repo.json has been written successfully.');
})();