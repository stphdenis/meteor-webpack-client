'use strict';

const path = require('path');
const fs = require('fs-extra');

module.exports = function createMeteorLibs(options, manifest, meteorBuildPath, meteorClientPath, meteorLibsPath) {
  const starJson = getStarJson();
  const meteorPackagesJson = getMeteorPackagesJson();

  if(meteorPackagesJson.meteorRelease !== starJson.meteorRelease) {
    const files = fs.readdirSync(meteorLibsPath);
    files.forEach(function(file) {
      const filePath = meteorLibsPath + '/' + file;
      if (fs.statSync(filePath).isDirectory() &&
        file !== 'node_modules' &&
        file.startsWith('.') === false &&
        file.startsWith('_') === false
      ) {
        fs.removeSync(filePath);
      }
    });

    meteorPackagesJson.meteorRelease = starJson.meteorRelease;
    meteorPackagesJson.modules = {};
  }

  const meteorGlobals = getMeteorGlobals();
  manifest.forEach(pckge => {
    if (pckge.where === 'client' && pckge.type === 'js') {
      const regexResult = /packages\/([\w-]+).js/.exec(pckge.path);
      const moduleName = regexResult && regexResult[1];
      if (moduleName && !(moduleName in meteorPackagesJson.modules)) {
        const moduleDependencies = getModuleDependencies(meteorClientPath + '/packages/' + moduleName + '.js');
        if (moduleName === 'accounts-base') {
          moduleDependencies.add('localstorage');
        }
        meteorPackagesJson.modules[moduleName] = {
          'dependencies': Array.from(moduleDependencies),
          'path': pckge.path,
          'global-scope': meteorGlobals[moduleName]
                        ? meteorGlobals[moduleName]
                        : [],
        };
        createMeteorLib(moduleName, meteorPackagesJson.modules[moduleName]);
      }
    }
  });
  fs.writeFileSync(`${meteorLibsPath}/meteor-packages.json`, JSON.stringify(meteorPackagesJson));

  /**
   * 
   */
  function getModuleDependencies(modulePath) {
    const moduleSource = fs.readFileSync(modulePath);
    const rechDeps = /[\n\r]+var ([$\w]+) = Package(?:\.([a-z\d]+)|\['([a-z\d-]+)'\])\.([$\w]+);/g;
    let dependencies = new Set();

    let dependency = rechDeps.exec(moduleSource);
    while (dependency) {
      dependencies.add(dependency[2]||dependency[3]);
      dependency = rechDeps.exec(moduleSource);
    }
    return dependencies;
  }

  function createMeteorLib(moduleName, moduleDescription) {
    let indexJsString = '\'use strict\';\n';
    if (moduleName === 'meteor') {
      indexJsString += `require('meteor-webpack-client/runtime-config');\n`;
      indexJsString += `require('${path.join(meteorClientPath, 'merged-stylesheets.css').replace(/\\/g, '/')}');\n`;
    }
    moduleDescription.dependencies.forEach(moduleDep => {
      indexJsString += `require('meteor/${moduleDep}');\n`;
    });
    indexJsString += `require('${path.join(meteorClientPath, 'packages', moduleName).replace(/\\/g, '/')}');\n`;
    if (moduleName === 'accounts-base') {
      indexJsString += `require('meteor/service-configuration');\n`;
    }
    indexJsString += `var pkg = Package['${moduleName}'];
for(var key in pkg) {
  exports[key] = pkg[key];
}
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = pkg[0];
`;
    if (moduleDescription['global-scope'].length) {
      indexJsString += `if(__meteor_runtime_config__.PUBLIC_SETTINGS.__global_scope__) {\n`;
      moduleDescription['global-scope'].forEach(globalName => {indexJsString += `  globals.${globalName} = pkg.${globalName};\n`;});
      indexJsString += `}\n`;
    }

    fs.mkdirSync(`${meteorLibsPath}/${moduleName}`);
    fs.writeFileSync(`${meteorLibsPath}/${moduleName}/index.js`, indexJsString);
  }

  function getStarJson() {
    try {
      return JSON.parse(fs.readFileSync(`${meteorBuildPath}/star.json`));
    } catch (e) {
      throw Error('Run Meteor at least once.');
    }
  }

  function getMeteorPackagesJson() {
    try {
      return JSON.parse(fs.readFileSync(`${meteorLibsPath}/meteor-packages.json`));
    } catch (e) {
      try {
        fs.mkdirSync(meteorLibsPath);
      } catch (e) {
        undefined;
      }
      return {
        meteorRelease: '---'
      };
    }
  }

  function getMeteorGlobals() {
    const globalsSource = fs.readFileSync(`${meteorClientPath}/packages/global-imports.js`);
    const rechDeps = /[\n\r]+([$\w]+) = Package(?:\.([a-z\d]+)|\['([a-z\d-]+)'\])\.([$\w]+);/g;
    const meteorGlobals = new Map();

    let meteorGlobal = rechDeps.exec(globalsSource);
    while (meteorGlobal) {
      const moduleName = meteorGlobal[2]||meteorGlobal[3];
      if(!meteorGlobals[moduleName]) {
        meteorGlobals[moduleName] = [];
      }
      meteorGlobals[moduleName].push(meteorGlobal[1]);
      meteorGlobal = rechDeps.exec(globalsSource);
    }
    return meteorGlobals;
  }
};
