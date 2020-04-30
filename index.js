const fs      = require('fs');
const fetch   = require('node-fetch');
const chalk   = require('chalk');
const request = require('request');

// Get any environment variables we need
require('dotenv').config();
const {
  INSTAGRAM_AUTH,
  BRANCH } = process.env;


const download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};


module.exports = {

  async onPreBuild({ inputs, utils, constants }) {

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

      instagramData = [];
      for (const image of data.data) {
        let localImageURL = `${inputs.imageFolder}/${image.id}.jpeg`;
        instagramData.push({
          "id": image.id,
          "time": image.created_time,
          "caption": image.caption.text,
          "instagramURL": image.link,
          "sourceImageURL": image.images.standard_resolution.url,
          "localImageURL": localImageURL
        })
      }
      await fs.writeFileSync(dataFile, JSON.stringify(instagramData));
      await utils.cache.save(dataFile, { ttl: inputs.ttl });
      console.log(chalk.yellow("Instagram data fetched and cached"), chalk.gray(`(TTL:${inputs.ttl} seconds)`));
    }

    for (const image in instagramData) {

      let {
        localImageURL,
        sourceImageURL,
        caption } = instagramData[image];

      console.log('image :>> ', caption);
      // if the image exists in the cache, recover it.
      if ( await utils.cache.has(localImageURL) ) {
        await utils.cache.restore(localImageURL);
        console.log('Restored from cache:', chalk.green(localImageURL));
      } else {
        // if the image is not cached, fetch and cache it.
        await download(sourceImageURL, localImageURL, async function(){
          console.log("Saved:", localImageURL);
          await utils.cache.save(localImageURL);
        });

      }
    }
  }
}


