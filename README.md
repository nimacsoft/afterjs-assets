# After.js Assets

![afterjs-assets-status](https://david-dm.org/nimacsoft/afterjs-assets.svg)
[![npm version](https://badge.fury.io/js/afterjs-assets.svg)](https://badge.fury.io/js/afterjs-assets)

# The Problem with After.js

If you ever tried to build an Server Side Renderd App with After.js you well notice that when you code spilit your components, After.js only send the main css and js files then in client side in `ensureReady` method tries to fetch javascript and css files. **it's too slow** (even Google PageSpeed Insights warns about it)

After.js Assets solves problem by adding a plugin to razzle and call a fucntion in custom Document file

# Setup

First Install afterjs-assets:

```sh
yarn add afterjs-assets
```

then create a `razzle.config.js` file in root of project (next to the `package.json`) and put this content inside it:

```javascript
// razzle.config.js

module.exports = {
  plugins: ['manifest'],
};
```

this will load [razzle-plugin-manifest](https://github.com/nimacsoft/razzle-plugin-manifest), this plugin will generate `manifest.json` file next to the **server.js** file in build folder. (we will use this file in next steps).
checkout it's repo for more options and configuration.

## Add name and chunkName to [routes](https://github.com/jaredpalmer/after.js/blob/master/README.md#code-splitting)

```javascript
// ./src/routes.js

import React from 'react';
import Home from './Home';
import { asyncComponent } from '@jaredpalmer/after';

export default [
  // normal route
  {
    name: "HomePage",
    path: '/',
    exact: true,
    component: Home,
  },
  // codesplit route
  {
    name: "AboutUs",
    path: '/about',
    exact: true,
    component: asyncComponent({
      loader: () => import(/* webpackChunkName: "AboutUs" */ './About'), // required
      Placeholder: () => <div>...LOADING...</div>, // this is optional, just returns null by default
    }),
  },
];
```

Note 1: `name` must be uniqe and **all routes** must have a name with uniqe `value`.

Note 2: we used [webpackChunkName](https://webpack.js.org/guides/code-splitting/#dynamic-imports) with dynamic import, **chunk name Must be as same as name property**.

```javascript
{
  name: "AboutUs",
  path: '/about',
  component: asyncComponent({
    loader: () => import(/* webpackChunkName: "AboutUs" */ './About'),
  }),
},
{
  name: "Shop",
  path: '/shop',
  component: asyncComponent({
    loader: () => import(/* webpackChunkName: "Shop" */ './ShopComponent'),
  }),
},
```

## Create Custom `<Document />`

Based on After.js [Guide](https://github.com/jaredpalmer/after.js/blob/master/README.md#custom-document) create a file in ./src/Document.js like so:

```javascript
// ./src/Document.js

import React from 'react';
import { AfterRoot, AfterData } from '@jaredpalmer/after';

class Document extends React.Component {
  static async getInitialProps({ assets, data, renderPage }) {
    const page = await renderPage();
    return { assets, data, ...page };
  }

  render() {
    const { helmet, assets, data } = this.props;
    // get attributes from React Helmet
    const htmlAttrs = helmet.htmlAttributes.toComponent();
    const bodyAttrs = helmet.bodyAttributes.toComponent();

    return (
      <html {...htmlAttrs}>
        <head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {helmet.title.toComponent()}
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
          {assets.client.css && (
            <link rel="stylesheet" href={assets.client.css} />
          )}
        </head>
        <body {...bodyAttrs}>
          <AfterRoot />
          <AfterData data={data} />
          <script
            type="text/javascript"
            src={assets.client.js}
            defer
            crossOrigin="anonymous"
          />
        </body>
      </html>
    );
  }
}

export default Document;
```

Then import `getAssets` from `afterjs-assets` and call it in `static getInitialProps`:

Note: `manifest.json` will get generated at build time so don't worry if it's not already exist.

```javascript
// ./src/Document.js

import manifest from '../build/manifest.json';
import { getAssests } from 'afterjs-assets';

const prefix =
  process.env.NODE_ENV === "production"
    ? "/"
    : `http://${process.env.HOST!}:${parseInt(process.env.PORT!, 10) + 1}/`


class Document extends React.Component {

  static async getInitialProps({ assets, data, renderPage, req }) {
    const page = await renderPage();
  
    // call getAssests and pass styles and scripts to component
    const { styles, scripts } = getAssests({ req, routes, manifest });
    return { assets, data, styles, scripts, ...page };
  }

}
```

then in `render` method just loop through scripts and styles

```javascript
  render() {
    const { helmet, assets, data } = this.props;
    const htmlAttrs = helmet.htmlAttributes.toComponent();
    const bodyAttrs = helmet.bodyAttributes.toComponent();

    return (
      <html {...htmlAttrs}>
        <head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {helmet.title.toComponent()}
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
          {assets.client.css && (
            <link rel="stylesheet" href={assets.client.css} />
					)}
          {styles.map((path) => (
            <link key={path} rel="stylesheet" href={path} />
          ))}
        </head>
        <body {...bodyAttrs}>
          <AfterRoot />
          <AfterData data={data} />
          <script
            type="text/javascript"
            src={assets.client.js}
            defer
            crossOrigin="anonymous"
          />
          {scripts.map((path) => (
            <script
              key={path}
              defer
              type="text/javascript"
              src={prefix + path}
              crossOrigin="anonymous"
            />
          ))}
        </body>
      </html>
    );
  }
```

## Call ensureReady after Window Load

if we call ensureReady on browser (client), it will try to download styles and scripts for second time, (i don't know why browsers allow this). to fix this just call ensureReady on windows.onload method:

```javascript
window.onload = () => {
  ensureReady(routes).then((data) =>
    hydrate(
      <BrowserRouter>
        <After data={data} routes={routes} />
      </BrowserRouter>,
      document.getElementById("root")
    )
  )
}

```

## Typescript Support

This Project Written in TypeScript and types available in `index.d.ts` so there is no need to install any `@types/` package. 

## Contribution

Feel free to propose changes or open issues.

# 

I'm really thinking about duplicate values in routes (name and webpackChunkName) but couldn't find any suitable solution.

we can use webpackChunkName with dynamic import to name chunks by requested filename.

```javascript
// routes.js


function myAsyncComponentLoader(page) {
  return asyncComponent({
      loader: () => import(/* webpackChunkName: "[request]" */ `./pages/${page}`),
    }),
}

const routes = [
  {
    name: "About", // About.js file which located in ./pages/About.js
    path: '/about',
  },
  {
    name: "Home", // Home.js file which located in ./pages/Home.js
    path: '/',
    exact: true,
  },
]

export default routes.map(route => {
  const { name: componentName } = route
  return { component: myAsyncComponentLoader(componentName), ...route }
})
```

#

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
