const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Uint Test", async () => {
      let lottery, vrfCoordinatorMoc;
      const chainId = network.config.chainId;
      let lotteryEntranceFee;
      let deployer;
      let interval;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        lottery = await ethers.getContract("Lottery", deployer);
        console.log("lotter done");
        vrfCoordinatorMoc = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        console.log("mock done");
        lotteryEntranceFee = networkConfig[chainId]["entranceFee"];
        interval = await lottery.getInterval();
      });

      describe("constructor", async () => {
        it("initializes the lottery correctly", async () => {
          const lotteryState = await lottery.getLotteryStatus();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        });
      });

      describe("enterLottery", async () => {
        it("reverts when you do not pay enough", async () => {
          await expect(lottery.entryLottery()).to.be.revertedWith(
            "Lottery__NotEnoughEntranceFee"
          );
        });
        it("records players when they entry", async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          const player = await lottery.getPlayer(0);
          assert.equal(player, deployer);
        });
        it("emits event on enter", async () => {
          await expect(
            lottery.entryLottery({ value: lotteryEntranceFee })
          ).to.emit(lottery, "LotterEnter");
        });
        it("doesn't allow to entry when lottery status is calculating", async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep([]);
          await expect(
            lottery.entryLottery({ value: lotteryEntranceFee })
          ).to.be.revertedWith("Lottery__NotOpen");
        });
      });

      describe("checkUpkeep", async () => {
        it("returns false when people dosent send any value", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
        it("returns false if lottery is not open", async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep([]);

          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
      });

      describe("performUpkeep", async () => {
        it("can only run if checkUpkeep return true", async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep([]);
          assert(tx);
        });
        it("reverts when checkUpkeep return false", async () => {
          await expect(lottery.performUpkeep([])).to.be.revertedWith(
            "Lottery__UpkeepNotNeeded"
          );
        });
        it("updated the lottery state, emits the event, call the vrf coordinator", async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const transactionResponse = await lottery.performUpkeep([]);
          const transactionReceipt = await transactionResponse.wait(1);
          const requestId = transactionReceipt.events[1].args.requestId;
          const lotteryState = await lottery.getLotteryStatus();
          assert(requestId.toNumber() > 0);
          assert.equal(lotteryState.toString(), "1");
        });
      });

      describe("fulfillRandomWords", async () => {
        beforeEach(async () => {
          await lottery.entryLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });
        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorMoc.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });
        it("pick a winner, set the lottery satus and send the money", async () => {
          const additionalEntrance = 3;
          const startingAccountIndex = 1;
          const accounts = await ethers.getSigners();
          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrance;
            i++
          ) {
            const accountConnectedLottery = lottery.connect(accounts[i]);
            await accountConnectedLottery.entryLottery({
              value: lotteryEntranceFee,
            });
          }
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
                console.log(recentWinner);
                console.log(accounts[0].address);
                console.log(accounts[1].address);
                console.log(accounts[2].address);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
            const transactionResponse = await lottery.performUpkeep([]);
            const transactionReceipt = await transactionResponse.wait(1);
            const requestId = transactionReceipt.events[1].args.requestId;
            await vrfCoordinatorMoc.fulfillRandomWords(
              requestId,
              lottery.address
            );
          });
        });
      });
    });
