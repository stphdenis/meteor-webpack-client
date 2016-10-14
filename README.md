"# meteor-webpack-client"
Use Meteor's native client packages in a non Meteor project.

The packages are from a local meteor install of any version whith their css files.

### Installation

#### NPM
From your non-meteor client :
`npm install --save meteor-webpack-client`

### Usage

#### 1. Meteor setup :
Install all packages you need in meteor and run it one time to refresh the client side.

#### 2. Client setup (webpack client, not the client side of meteor) :

To define `__meteor_runtime_config__` global variable you have to make a `meteor-runtime-config.js` file in your root.
The following is the default if empty :
```js
export const __meteor_runtime_config__ = {
  meteorEnv: {},
  DDP_DEFAULT_CONNECTION_URL: 'http://localhost:3000',
  PUBLIC_SETTINGS: {
    __global_scope__: true
  }
};
```
* Set DDP connection url with `DDP_DEFAULT_CONNECTION_URL` if using DDP
* Make Meteor objects global with `__global_scope__: true`.

#### 3. easy-webpack configuration :

   This package is to be used with easy-webpack. You have to add the following code to your `webpack.config.js` :
```js
config = generateConfig(
  config,
  require('meteor-webpack-client')()
);
```

You can add options :
- `meteorPath`: where meteor is installed (can be absolute or relative),
- `meteorLibsPath`: where meteor adapters will be written (can be absolute or relative),
- `exclude`: a list of modules to be excluded from the bundle.

The following example show the options by default :
```js
require('meteor-webpack-client')({
  meteorPath: '../server',
  meteorLibsPath: './.meteor-libs',
  exclude: [
    'autoupdate',
    'global-imports',
    'hot-code-push',
    'reload',
    'ecmascript'
  ]
})
```

   It makes it possible to import the packages as in Meteor 1.3+ :
```js
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
```

The packages bundled by webpack are only those imported by your code with their dependencies.

All css files bundled by meteor are bundled by webpack.

### What I've done
The code is in the native compiled version of Meteor for a given version.

I wanted to be able to use meteor's modules with webpack using `import {...} from 'meteor/...'` and working with Aurelia.
