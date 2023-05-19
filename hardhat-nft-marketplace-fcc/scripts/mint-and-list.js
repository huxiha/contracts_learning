const { ethers } = require("hardhat");

async function mintAndList() {
  const nftMarket = await ethers.getContract("NftMarket");
  const basicNft = await ethers.getContract("BasicNft");

  console.log("minting nft...");
  const mintTx = await basicNft.mintNft();
  //   const mintTxRecepit =
  await mintTx.wait(1);

  console.log("approve nft...");
  const approveTx = await basicNft.approve(nftMarket.address, 0);
  await approveTx.wait(1);

  console.log("list nft...");
  const listTx = await nftMarket.listItem(
    basicNft.address,
    0,
    ethers.utils.parseEther("0.001")
  );
  await listTx.wait(1);
  console.log("listed!");
}

mintAndList()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
