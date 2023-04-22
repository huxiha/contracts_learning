const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let FundMe;
      let deployer;
      let MockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        //deploy our contract before test
        // const depolyers = ethers.getSigners(); //will get the accounts for the network in the hardhat.config.js
        // deployer = accounts[0]; //we chose one to sign the transaction

        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        FundMe = await ethers.getContract("FundMe", deployer);
        MockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await FundMe.getPriceFeed();
          assert.equal(response, MockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you do not send enough eth", async () => {
          await expect(FundMe.fund()).to.be.revertedWith("Didn't send enough!");
        });
        it("updated the amount of the funded data structure", async () => {
          await FundMe.fund({ value: sendValue });
          const response = await FundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Add getFunder to the array of getFunder", async () => {
          await FundMe.fund({ value: sendValue });
          const response = await FundMe.getFunder(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", async () => {
        beforeEach(async () => {
          await FundMe.fund({ value: sendValue });
        });
        it("Withdraw ETH from the single funder", async () => {
          const startingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const startingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          const response = await FundMe.withdraw();
          const transactionReceipt = await response.wait(1);
          //   console.log(transactionReceipt);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const endingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Allow us to withdraw with multiple getFunder", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const startingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          const response = await FundMe.withdraw();
          const transactionReceipt = await response.wait(1);
          //   console.log(transactionReceipt);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const endingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allow the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[2];
          const attackerConnectedContract = await FundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(FundMe, "FundMe__NotOwner");
        });
      });

      describe("cheaperWithdraw", async () => {
        beforeEach(async () => {
          await FundMe.fund({ value: sendValue });
        });
        it("Withdraw ETH from the single funder", async () => {
          const startingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const startingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          const response = await FundMe.cheaperWithdraw();
          const transactionReceipt = await response.wait(1);
          //   console.log(transactionReceipt);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const endingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Allow us to withdraw with multiple getFunder", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const startingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          const response = await FundMe.cheaperWithdraw();
          const transactionReceipt = await response.wait(1);
          //   console.log(transactionReceipt);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await FundMe.provider.getBalance(
            FundMe.address
          );
          const endingDeployerBalance = await FundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allow the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[2];
          const attackerConnectedContract = await FundMe.connect(attacker);
          await expect(
            attackerConnectedContract.cheaperWithdraw()
          ).to.be.revertedWithCustomError(FundMe, "FundMe__NotOwner");
        });
      });
    });
