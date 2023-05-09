const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecrete = process.env.PINATA_API_SECRETE;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecrete);

async function storageImages(imageFilePath) {
  const fullImageFilePath = path.resolve(imageFilePath);
  const files = fs.readdirSync(fullImageFilePath);
  console.log(files);
  let response = [];
  for (fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImageFilePath}/${files[fileIndex]}`
    );
  }
}

module.exports = { storageImages };
