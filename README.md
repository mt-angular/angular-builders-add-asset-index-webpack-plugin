# @ud-angular-builders/add-asset-index-plugin
<!-- [![npm version](https://img.shields.io/npm/v/@up-angular-builders/custom-webpack.svg) ![npm](https://img.shields.io/npm/dm/@up-angular-builders/custom-webpack.svg)](https://www.npmjs.com/package/@up-angular-builders/custom-webpack) -->



@ud-angular-builders/add-asset-index-plugin is a Webpack Plugin using [@ud-angular-builders/custom-webpack](https://www.npmjs.com/package/@ud-angular-builders/custom-webpack).

@ud-angular-builders/custom-webpack is an Angular Builder allowing to transform Angular Webpack configuration. It also allows to transform
the output index.html. However, the index transformation hook is not inside webpack compilation and all the webpack context and configuration is lost. **@ud-angular-builders/add-asset-index-plugin** allows to add `<link>` tag in the index.html emitted by Angular during the webpack build process.

It is useful for activating [cache busting](https://www.keycdn.com/support/what-is-cache-busting) for instance.

## Example:

```html
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>AngularTest</title>
    <base href="/">

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="stylesheet" href="styles.0e5d74c770da8e85b22e.css">
    <link href="assets/bust-cached-font/libre-franklin/libre-franklin-v2-latin-400.8d503c823a91e889c0e7.woff2" as="font"
          rel="preload">
    <link href="assets/bust-cached-font/rubik/rubik-v7-latin-300.eb02199844b4e2a0871c.woff2" as="font" rel="preload">
    <link href="assets/bust-cached-font/rubik/rubik-v7-latin-400.1ecc21093d3c8aa44b3e.woff2" as="font" rel="preload">
    <link href="assets/bust-cached-font/rubik/rubik-v7-latin-500.d3fd715f234b8dcdd09d.woff2" as="font" rel="preload">
    <link href="assets/bust-cached-font/rubik/rubik-v7-latin-700.9aff6f99df5790ad5dbd.woff2" as="font" rel="preload">
</head>

<body>
    <app-root></app-root>
    <script type="text/javascript" src="runtime.26209474bfa8dc87a77c.js"></script>
    <script type="text/javascript" src="polyfills.8a55347372f0994ae121.js"></script>
    <script type="text/javascript" src="main.71b7733a833b42b9ab31.js"></script>
</body>

</html>
```


# This documentation is for version 8 only. Find documentation for version 7 [here](https://github.com/mt-angular/angular-builders-add-asset-index-webpack-plugin/tree/angular7/README.md).

# Prerequisites:
 - [Angular CLI 8](https://www.npmjs.com/package/@angular/cli)
 - [@angular-devkit/build-angular](https://npmjs.com/package/@angular-devkit/build-angular) >= 0.801.0

# Usage

First of all, install @up-angular-builders/custom-webpack

 1. ```npm i -D @up-angular-builders/custom-webpack```
 2. In your `angular.json`:
    ```js
    "projects": {
      ...
      "[project]": {
        ...
        "architect": {
          ...
          "[architect-target]": {
            "builder": "@up-angular-builders/custom-webpack:[browser|server|karma|dev-server]"
            "options": {
                  "customWebpackConfig" : { "HERE GOES THE CUSTOM WEBPACK OPTIONS" }
            }
     ```
    Where:
    - [project] is the name of the project to which you want to add the builder
    - [architect-target] is the name of build target you want to run (build, serve, test etc. or any custom target)
    - [browser|server|karma|dev-server] one of the supported builders - [browser](#Custom-webpack-browser), [server](#Custom-webpack-server), [karma](#Custom-webpack-Karma) or [dev-server](#Custom-webpack-dev-server)
 3. If `[architect-target]` is not one of the predefined targets (like build, serve, test etc.) then run it like this:  
    `ng run [project]:[architect-target]`  
    If it is one of the predefined targets, you can run it with `ng [architect-target]`

 ## For example
  - angular.json:
    ```js
    "projects": {
      ...
      "example-app": {
        ...
        "architect": {
          ...
          "build": {
            "builder": "@up-angular-builders/custom-webpack:browser"
            "options": {
                "customWebpackConfig": {
                    "path": "./extra-webpack.config.js"
                },
            }
     ```
  - Run the build: `ng build`

# Builders

 - [@up-angular-builders/custom-webpack:browser](#Custom-webpack-browser)
 - [@up-angular-builders/custom-webpack:server](#Custom-webpack-server)
 - [@up-angular-builders/custom-webpack:karma](#Custom-webpack-Karma)
 - [@up-angular-builders/custom-webpack:dev-server](#Custom-webpack-dev-server)


For more details on custom-webpack, please check the [@up-angular-builders/custom-webpack](https://www.npmjs.com/package/@ud-angular-builders/custom-webpack). You can check a full example [here](https://github.com/mt-angular/angular-builders/tree/angular8/packages/custom-webpack/examples/full-cycle-app/angular.json)


Now, you can write the webpack configuration in `./extra-webpack.config.js`:

```js
const path = require('path');
const { AddAssetIndexPlugin } = require('@up-angular-builders/custom-webpack');

module.exports = buildParameters => {
    // the properties of buildParameters are
    // const { builderContext, buildOptions, baseWebpackConfig } = buildParamters;

    const configuration = {
        module: {
             rules: [
                {
                    test: /\.css$/,
                    loader: 'css-loader',
                    options: {
                        name: `[name][hash].[ext]`,
                    },
                 }
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
              ENVIRONMENT: JSON.stringify('browser')
            }),
            new webpack.NormalModuleReplacementPlugin(/(.*)\$environment\$(\.*)/, function (resource) {
              resource.request = resource.request.replace(/\$environment\$/, 'browser');
            }),

            new AddAssetIndexPlugin([
                {
                    filepath: 'src/font/**/*.woff2',
                    attributes: {
                        as: 'font',
                        rel: 'preload'
                    },
                    // deployUrl: 'public/deploy',
                    hash: true,
                    place: 'head',
                    sri: true,
                    outputDir: filepath => {
                        const split = filepath.split('src/font/');
                        const newpath = path.join('assets/bust-cached-font', split[1]);

                        return path.dirname(newpath);
                    }
                }
            ], builderParameters)
        ]
    };

    // ovveride allows to merge or override the Angular webpack configuration
    // return configration directly is the same as the following.
    return { configuration, ovveride: false };
};
```


The result will be the html [example](#example) showed at the beginning.
