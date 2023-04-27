const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("1");
module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinator, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorMoc = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinator = vrfCoordinatorMoc.address;
    const transactionResponse = await vrfCoordinatorMoc.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorMoc.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinator = networkConfig[chainId]["vrfCoordinator"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];

  const lottery = await deploy("Lottery", {
    from: deployer,
    log: true,
    args: [
      vrfCoordinator,
      entranceFee,
      gasLane,
      subscriptionId,
      callbackGasLimit,
      interval,
    ],
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
  }

  log("------------------------------------------------");
};

module.exports.tags = ["all", "Lottery"];
