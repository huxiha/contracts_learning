const { getNamedAccounts, ethers } = require("hardhat");
const { getWETH, AMOUNT } = require("./getWeth");

async function main() {
  await getWETH();
  const { deployer } = await getNamedAccounts();
  const lendingPool = await getLendingPool(deployer);
  console.log(`Lending pool address: ${lendingPool.address}`);

  //approve
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; //weth合约地址
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
  lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("deposited!");

  //borrow some Dai
  let { totalDebtETH, availableBorrowsETH } = await getBorrowUserAccountData(
    lendingPool,
    deployer
  );

  const daiPrice = await getDaiPrice();
  const amountDaiToBorrow =
    (availableBorrowsETH.toString() * 0.95) / daiPrice.toNumber();
  console.log(`You can borrow ${amountDaiToBorrow} DAI`);
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);
  await getBorrowUserAccountData(lendingPool, deployer);

  //repay
  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer);
  await getBorrowUserAccountData(lendingPool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log("Repaied!");
}

async function borrowDai(daiAddress, lendingPool, amount, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amount, 1, 0, account);
  await borrowTx.wait(1);
  console.log("Borrowed!");
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserAccountData(lendingPool, account) {
  console.log("here");
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} ETH deposited!`);
  console.log(`You have ${totalDebtETH} ETH borrowed!`);
  console.log(`You can borrow ${availableBorrowsETH} ETH!`);
  return { totalDebtETH, availableBorrowsETH };
}

async function getLendingPool(account) {
  //lendingPoolProvider: contract address: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5 abi通过复制合约接口获取
  const LendingAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );
  const lendingPoolAddress = await LendingAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

async function approveErc20(
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address,
    account
  );
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
