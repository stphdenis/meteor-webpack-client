'use strict';

/** This is the new way to load meteor with WebPack */
const path = require('path');
const fs = require('fs-extra');
const createMeteorLibs = require('./create-meteor-libs');

module.exports = function loaderModule(options) {
  // init of the module
  options = options || {};
  options.rootDir = options.rootDir || path.resolve();
  options.meteorPath = options.meteorPath || '../server';
  options.meteorLibsPath = options.meteorLibsPath || './.meteor-libs';
  options.exclude = [
    'autoupdate',
    'global-imports',
    'hot-code-push',
    'reload',
    'ecmascript',
  ].concat(options.exclude || []);

  return function loader() {
    const meteorBuildPath = options.meteorPath[0] === '.'
                        ? path.resolve(options.rootDir, options.meteorPath, '.meteor', 'local', 'build')
                        : path.resolve(options.meteorPath, '.meteor', 'local', 'build')
                        ;
    const meteorClientPath = path.resolve(meteorBuildPath, 'programs', 'web.browser');
    const meteorLibsPath = options.meteorLibsPath[0] === '.'
                        ? path.resolve(options.rootDir, options.meteorLibsPath)
                        : options.meteorLibsPath
                        ;

    const manifest = getManifestJson();

    // init of the loader
    createMeteorLibs(options, manifest, meteorBuildPath, meteorClientPath, meteorLibsPath);

    function makeAliases(/*config*/) {
      const resolveAliases = {};

      const excluded = new RegExp(options.exclude
        .map(function(exclude){ return '^packages/' + exclude + '\.js$'; })
        .concat('^app\/.+.js$')
        .join('|'));

      manifest.forEach(function(pckge){
        if (excluded.test(pckge.path)) {
          return;
        }
        
        const location = /^packages\/(.+)\.js$/.exec(pckge.path);
        if (!location) {
          return;
        }

        const packageName = location[1].replace('_', ':');
        resolveAliases[`meteor/${packageName}`] = path.join(meteorLibsPath, packageName);
      });
      return resolveAliases;
    }

    function getManifestJson() {
      try {
        return JSON.parse(fs.readFileSync(`${meteorClientPath}/program.json`)).manifest;
      } catch (e) {
        throw Error('Run Meteor at least once.');
      }
    }

    return {
      resolve: {
        alias: makeAliases(this),
      },
    };
  };
};
