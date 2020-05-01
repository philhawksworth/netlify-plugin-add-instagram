const fs      = require('fs');
const fetch   = require('node-fetch');
const chalk   = require('chalk');

// Get any environment variables we need
require('dotenv').config();
const { INSTAGRAM_AUTH } = process.env;


module.exports = {

  async onPreBuild({ inputs, utils }) {

    const instagramFeedUrl = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${INSTAGRAM_AUTH}`;

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

      const data = await fetch(instagramFeedUrl)
        .then(res => res.json());

      console.log('data :>> ', data.data[0].images);

      instagramData = [];
      for (const image of data.data) {
        let localImageURL = `${inputs.imageFolder}/${image.id}.jpeg`;
        instagramData.push({
          "id": image.id,
          "time": image.created_time,
          "caption": image.caption.text,
          "instagramURL": image.link,
          "sourceImageURL": image.images[inputs.imageSize].url,
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


