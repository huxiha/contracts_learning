const { developmentChains } = require("../helper-hardhat-config");
const { network, ethers } = require("hardhat");

const baseFee = ethers.utils.paseEthers("0.25");
const gasPriceLink = 1e9;

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("Local network detected, deploy mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [baseFee, gasPriceLink],
    });
    log("Mock deployed");
    log(
      "---------------------------------------------------------------------- "
    );
  }
};

module.exports.tags = ["all", "mocks"];
