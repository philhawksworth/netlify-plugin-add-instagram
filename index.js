const fs      = require('fs');
const fetch   = require('node-fetch');
const chalk   = require('chalk');


module.exports = {

  async onPreBuild({ inputs, utils }) {

    const instagramGraphUrl = `https://www.instagram.com/${inputs.username}/?__a=1`;

    // Where fetched data should reside in the buid
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

      const data = await fetch(instagramGraphUrl)
        .then(res => res.json());

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
      console.log(chalk.yellow("Instagram data fetched and cached"), chalk.gray(`(TTL:${inputs.feedTTL} seconds)`));
    }

    for (const image in instagramData) {
      let { localImageURL, sourceImageURL } = instagramData[image];
      // if the image exists in the cache, recover it.
      if ( await utils.cache.has(localImageURL) ) {
        await utils.cache.restore(localImageURL);
        console.log('Restored from cache:', chalk.green(localImageURL));
      } else {
        // if the image is not cached, fetch and cache it.
        await fetch(sourceImageURL)
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


