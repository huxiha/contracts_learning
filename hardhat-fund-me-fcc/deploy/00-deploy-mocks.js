const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  //   log(deployer);
  //   const chainId = network.config.chainId;

  if (developmentChains.includes(network.name)) {
    log("local network deteted, deploy mock contracts");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });

    log("Mock deployed!");
    log("-------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
