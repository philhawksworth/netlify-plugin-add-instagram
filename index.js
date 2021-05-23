const fs      = require('fs');
const fetch   = require('node-fetch');
const chalk   = require('chalk');


module.exports = {

  async onPreBuild({ inputs, utils }) {

    const instagramGraphUrl = `https://www.instagram.com/${inputs.username}/?__a=1`;

    console.log('Instagram feed url:', chalk.yellow(instagramGraphUrl));

    // Where fetched data should reside in the build
    const dataFile = inputs.dataFile;

    // reinstate from cache if it is present
    let instagramData;
    if ( await utils.cache.has(dataFile) ) {
      await utils.cache.restore(dataFile);
      instagramData = require(`${process.cwd()}/${dataFile}`);
      console.log('Restored from cache:', chalk.green(dataFile));
    }
    // Or if it's not cached, let's fetch it and cache it.
    else {


      const data = await fetch(instagramGraphUrl, {
        headers: {
          cookie: `sessionid=${inputs.sessionID}`
        }
      })
        .then(res => {
          // ensure that we are only acting on JSON responses
          if(res.headers.get('content-type').includes('application/json')){
            return res.json();
          } else {
            return res.text();
          }
        });

      // If we didn't receive JSON, fail the plugin but not the build
      if(!data?.graphql?.user?.edge_owner_to_timeline_media?.edges){
        utils.build.failPlugin(`The Instagram feed did not return expected data.\nProceeding with the build without the data from the plugin.`);
        return;
      }

      instagramData = [];
      for (const image of data.graphql.user.edge_owner_to_timeline_media.edges) {
        let localImageURL = `${inputs.imageFolder}/${image.node.shortcode}_${inputs.imageSize}.jpeg`;
        instagramData.push({
          "id": image.node.shortcode,
          "time": image.node.taken_at_timestamp,
          "caption": image.node.edge_media_to_caption.edges[0] ? image.node.edge_media_to_caption.edges[0].node.text : '',
          "instagramURL": `https://www.instagram.com/p/${image.node.shortcode}`,
          "sourceImageURL": `https://www.instagram.com/p/${image.node.shortcode}/media/?size=${inputs.imageSize}`,
          "localImageURL": localImageURL
        })
      }
      await fs.writeFileSync(dataFile, JSON.stringify(instagramData));
      await utils.cache.save(dataFile, { ttl: inputs.feedTTL });
      console.log("Instagram data fetched from", chalk.yellow(instagramGraphUrl), "and cached", chalk.gray(`(TTL:${inputs.feedTTL} seconds)`));
    }


    // Now we have a well-formated data object describing the instagram feed,
    // let's fetch any uncached images we might need
    for (const image in instagramData) {
      let { localImageURL, sourceImageURL } = instagramData[image];
      // if the image exists in the cache, recover it.
      if ( await utils.cache.has(localImageURL) ) {
        await utils.cache.restore(localImageURL);
        console.log('Restored from cache:', chalk.green(localImageURL));
      } else {
        // if the image is not cached, fetch and cache it.
        await fetch(sourceImageURL, {
          headers: {
            cookie: `sessionid=${inputs.sessionID}`
          }
        })
          .then(async res => {
              const dest = fs.createWriteStream(localImageURL);
              res.body.pipe(dest);
              await utils.cache.save(localImageURL, { ttl: inputs.imageTTL });
              console.log("Image cached:", chalk.yellow(localImageURL), chalk.gray(`(TTL:${inputs.imageTTL} seconds)`));
          });
      }
    }

  }
}
