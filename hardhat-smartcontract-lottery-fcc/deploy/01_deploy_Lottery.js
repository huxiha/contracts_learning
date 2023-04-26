const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinator;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorMoc = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinator = vrfCoordinatorMoc.address;
  } else {
    vrfCoordinator = networkConfig[chainId]["vrfCoordinator"];
  }

  const entranceFee = networkConfig[chainId]["entranceFee"];

  const lottery = await deploy("Lottery", {
    from: deployer,
    log: true,
    args: [vrfCoordinator, entranceFee, 0, 0, 0, 0],
    waitConfirmations: network.config.blockConfirmations || 1,
  });
};
