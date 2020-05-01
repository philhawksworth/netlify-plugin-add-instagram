# Netlify Plugin - Add Instagram

This [plugin](https://www.netlify.com/build/plugins-beta?utm_source=github&utm_medium=plugin-addinstagram-pnh&utm_campaign=devex) adds the ability to source fetch and cache recent Instagram images so that they can be served as part of the site from the same domain, rather than serving directly from Facebook's Instagram CDN.

Some browser settings and extensions throttle or block serving assets from Facebook's CDN for privacy reasons. Serving these assets directly from the same CDN and domain as the rest of the site should give a small performance benefit too.

## Overview

This plugin requests data from Instagram feed that you associated with an Instagram Key that you will need to provide as an environment variable. It will save this data as JSON in the Netlify build cache and only re-request the feed after a specified time-to-live value has elapsed. It will also save all the image assets in the Netlify Build cache between builds and place them in the specified location for your static site generator to use.

Configure this plugin to present the gathered data and images in the appropriate location, so your chosen [static site generator](https://www.netlify.com/blog/2020/04/14/what-is-a-static-site-generator-and-3-ways-to-find-the-best-one/?utm_source=github&utm_medium=plugin-addinstagram-pnh&utm_campaign=devex) can leverage it during the build.


## Demonstration

See this plugin being used in this simplified demo site: https://demo-netlify-plugin-add-instagram.netlify.app/


## Installation

To include this plugin in your site deployment:


### 1. Add the plugin as a dependency

```bash

# Add the plugin as a dependency of your build
npm i --s netlify-plugin-add-instagram

```


### 2. Add the plugin and its options to your netlify.toml

This plugin will fetch the specified instagram feed and the latest 12 images and stash them prior to the execution of the `build` command you have specified in your Netlify configuration. The desired Instagram username and various caching attributes can be specified in the `netlify.toml` config file as shown below.

```toml
# Config for the Netlify Build Plugin: netlify-plugin-add-instagram
[[plugins]]
  package = "netlify-plugin-add-instagram"

  [plugins.inputs]

    # Where to put the image files
    imageFolder = "src/images/instagram"

    # Also stash data about the images in a json file
    dataFile = "src/_data/instagram.json"

    # How many seconds should we cache the instagram feed for?
    feedTTL = 30

    # How many seconds should we cache each instagram image for?
    imageTTL = 1209600   # 2 weeks

    # Which of Instagram's image sizes should we fetch?
    # t (thumbnail)
    # m (medium)
    # l (large)
    imageSize = "m"

    # Instagram username
    username = "philhawksworth"
```


### 3. Enable Build plugins on your site

Visit the Build Plugins page in the Netlify Admin to enable build plugins on your site.


## Quick try-out

You can try out this plugin by deploying [a simple site](https://demo-netlify-plugin-add-instagram.netlify.app/) which uses it.

Clicking the button below will clone [a test site repo](https://github.com/philhawksworth/demo-netlify-plugin-add-instagram), setup a new site [on Netlify](https://netlify.com?utm_source=github&utm_medium=plugin-addinstagram-pnh&utm_campaign=devex) and deploy the site complete with the plugin configured and operational.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/philhawksworth/demo-netlify-plugin-add-instagram)
