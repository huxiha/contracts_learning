const { getNamedAccounts, ethers, network } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.01");

async function getWETH() {
  const chainId = network.config.chainId;
  console.log(chainId);
  //   const url = network.config.forking.url;
  //   console.log(url);
  const { deployer } = await getNamedAccounts();
  console.log(deployer);
  //mainnet weth contract: abi-->通过IWeth.sol编译获取，contract address-->0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 sepolia:0xdd13E55209Fd76AfE204dBda4007C227904f0a81
  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer
  );

  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`Got ${wethBalance.toString()}WETH`);
}

module.exports = { getWETH, AMOUNT };
