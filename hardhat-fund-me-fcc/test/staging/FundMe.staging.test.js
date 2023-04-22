const { assert } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let deployer;
      let FundMe;
      const sendValue = "10000000000000000";
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        FundMe = await ethers.getContract("FundMe", deployer);
      });

      it("Allows people to fund and withdraw", async () => {
        await FundMe.fund({ value: sendValue });
        await FundMe.withdraw();
        const endingFundMeBalance = await FundMe.provider.getBalance(
          FundMe.address
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
