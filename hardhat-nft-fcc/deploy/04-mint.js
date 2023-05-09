const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();

  //   const basicNft = await ethers.getContract("BasicNft", deployer);
  //   const basicMintTx = await basicNft.mintNft();
  //   await basicMintTx.wait(1);
  //   console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`);

  const randomeIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
  const mintFee = await randomeIpfsNft.getMintFee();

  await new Promise(async (resolve, reject) => {
    setTimeout(resolve, 60000000);
    randomeIpfsNft.once("NftMinted", async () => {
      resolve();
    });
    randomeIpfsNft.once("NftRequested", async () => {
      console.log("requested mint!");
    });

    const randomIpfsMintTx = await randomeIpfsNft.requestNft({
      value: mintFee.toString(),
    });
  });
  console.log(
    `Random IPFS NFT index 0 has tokenURI: ${await randomeIpfsNft.tokenURI(0)}`
  );

  //   const highValue = ethers.utils.parseEther("400");
  //   const dynamicSvgNft = await ethers.getContract("DynamicSVGNft", deployer);
  //   const dynamicSvgNftMint = await dynamicSvgNft.mintNft(highValue.toString());
  //   await dynamicSvgNftMint.wait(1);
  //   console.log(
  //     `Dynamic SVG NFT index 0 has tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
  //   );
};

module.exports.tags = ["all", "mint"];
