const { network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat.config");
const { storageImages } = require("../utils/uploadToPinata");
require("dotenv").config();

const imageFileLocation = "./images/randomNFT";
async function handleTokenUris() {
  const tokenUris = [];
  //把NFT图片存到IPFS
  await storageImages(imageFileLocation);
  //把NFT描述信息存到IPFS

  return tokenUris;
}

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let vrfCoordinatorAddress, subscriptionId;

  vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinator;
  subscriptionId = networkConfig[chainId].subscriptionId;
  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  let tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
  ];
  const mintFee = networkConfig[chainId].mintFee;

  if (process.env.UPLOAD_TO_PINATA == "true") {
    console.log("here");
    tokenUris = await handleTokenUris();
  }

  log("------------begin deploy random IPFS NFT-----------");
  //   const randomIpfsNft = await deploy("RandomIpfsNft", {
  //     from: deployer,
  //     log: true,
  //     args: [
  //       vrfCoordinatorAddress,
  //       gasLane,
  //       subscriptionId,
  //       6,
  //       callbackGasLimit,
  //       1,
  //       tokenUris,
  //       mintFee,
  //     ],
  //     waitConfirmations: network.config.blockConfirmations || 1,
  //   });
};

module.exports.tags = ["all", "randomIpfsNft"];
