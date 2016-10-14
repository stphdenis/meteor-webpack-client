const defaults = require('./defaults');

(function() {
  let meteorRuntimeConfig;
  try {
    meteorRuntimeConfig = require('../../../meteor-runtime-config').__meteor_runtime_config__ || {};
  } catch (e) {
    console.warn('Make a meteor-runtime-config.js file at the root of your package to make this message disapear :');
    console.warn('have to contain ==> export const __meteor_runtime_config__ = {}');
  }

  // in non strict mode, 'this' has global scope
  this.__meteor_runtime_config__ = defaults(
    {},
    this.__meteor_runtime_config__,
    meteorRuntimeConfig,
    {
      meteorEnv: {},
      DDP_DEFAULT_CONNECTION_URL: 'http://localhost:3000',
      PUBLIC_SETTINGS: { __global_scope__: true }
    }
  );

  // in non strict mode, 'this' has global scope
  if (window !== undefined && window.globals === undefined) {
    window.globals = this;
  }
})();
