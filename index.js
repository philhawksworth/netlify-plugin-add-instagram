const fs      = require('fs');
const fetch   = require('node-fetch');
const chalk   = require('chalk');


// Get any environment variables we need
require('dotenv').config();
const {
  INSTAGRAM_AUTH,
  BRANCH } = process.env;


  module.exports = {

    async onPreBuild({ inputs, utils }) {

      const instagramFeedUrl = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${INSTAGRAM_AUTH}`;

      // Where fetched data should reside in the buid
      const dataFile = inputs.dataFile;

      // reinstate from cache if it is present
      if ( await utils.cache.has(dataFile) ) {
        await utils.cache.restore(dataFile);
        console.log('Restored from cache:', chalk.green(dataFile));
      }
      // Or if it's not cached, let's fetch it and cache it.
      else {

        const data = await fetch(instagramFeedUrl)
          .then(res => res.json());

        let savedData = [];
        for (const image of data.data) {
          savedData.push({
            "id": image.id,
            "time": image.created_time,
            "caption": image.caption.text,
            "instagramURL": image.link,
            "sourceImageURL": image.images.standard_resolution.url,
            "localImageURL": `${inputs.imageFolder}/${image.id}`
          })
        }

        // put the fetched data in the daa file, and then cache it.
        await fs.writeFileSync(dataFile, JSON.stringify(savedData));
        await utils.cache.save(dataFile, { ttl: inputs.ttl });
        console.log(chalk.yellow("Instagram data fetched and cached"), chalk.gray(`(TTL:${inputs.ttl} seconds)`));
      }

  }
}

