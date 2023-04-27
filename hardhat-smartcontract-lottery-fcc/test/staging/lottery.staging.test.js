const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Staging Test", async () => {
      let lottery;
      const chainId = network.config.chainId;
      let lotteryEntranceFee;
      let deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        console.log("lotter done");
        lotteryEntranceFee = networkConfig[chainId]["entranceFee"];
      });

      describe("fulfillRandomWords", async () => {
        it("works with live Chainlink keepers and chainlink VRF, and get a random winner", async () => {
          const startingTimeStamp = await lottery.getLastTimestamp();
          await new Promise(async (resolve, reject) => {
            lottery.once("winnerPicked", async () => {
              try {
                console.log("fund the event");
                const recentWinner = await lottery.getRecentWinner();
                const lotteryState = await lottery.getLotteryStatus();
                const endingTimeStamp = await lottery.getLastTimestamp();
                const numberPlayer = await lottery.getPlayersNumber();
                assert.equal(numberPlayer.toString(), "0");
                assert.equal(lotteryState.toString(), "0");
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            await lottery.entryLottery({
              value: lotteryEntranceFee,
            });
          });
        });
      });
    });
