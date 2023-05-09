const { network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat.config");
const fs = require("fs");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const priceFeedAddress = networkConfig[chainId].priceFeedAddress;
  const lowSvg = await fs.readFileSync("./images/dynamicNFT/frown.svg", {
    encoding: "utf8",
  });
  const highSvg = await fs.readFileSync("./images/dynamicNFT/happy.svg", {
    encoding: "utf8",
  });

  const args = [priceFeedAddress, lowSvg, highSvg];

  log("------------begin deploy dynamic svg nft------------");

  const dynamicNft = await deploy("DynamicSVGNft", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("------------deployed dynamic svg nft!------------");
};

module.exports.tags = ["all", "dynamicSVG"];
