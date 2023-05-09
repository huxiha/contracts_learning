const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecrete = process.env.PINATA_API_SECRETE;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecrete);

//上传NFT图片到IPFS
async function storageImages(imageFilePath) {
  const fullImageFilePath = path.resolve(imageFilePath);
  const files = fs.readdirSync(fullImageFilePath);
  console.log(files);
  let responses = [];
  console.log("uploading to IPFS");
  for (fileIndex in files) {
    console.log(`working with file ${fileIndex}`);
    const readableStreamForFile = fs.createReadStream(
      `${fullImageFilePath}/${files[fileIndex]}`
    );
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storageTokenUriMetadata(tokenUriMetadata) {
  try {
    const response = pinata.pinJSONToIPFS(tokenUriMetadata);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = { storageImages, storageTokenUriMetadata };
