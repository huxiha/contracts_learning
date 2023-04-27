// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Lottery__NotEnoughEntranceFee();
error Lottery__TransferFailed();
error Lottery__NotOpen();
error Lottery__UpkeepNotNeeded(
    uint256 lotteryStatus,
    uint256 numPlayers,
    uint256 currentBalance
);

/**
 * @title 一个简单的彩票合约
 * @author huxixi
 * @notice 这是一个去中心化合约
 * @dev 开发借助chainlink VRF生成随机数和chainlink automation自动选择中奖人
 */

contract Lottery is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // 彩票游戏状态
    enum LotteryStatus {
        OPEN,
        CALCULATING
    }

    //票价只能在创建合约时被赋值一次，不能修改
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    address private s_recentWinner;
    LotteryStatus private s_lotteryStatus;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    event LotterEnter(address indexed player);
    event requestedLotteryWinner(uint256 indexed requestId);
    event winnerPicked(address winner);

    constructor(
        address _vrfCoordinator,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryStatus = LotteryStatus.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function entryLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughEntranceFee();
        }
        if (s_lotteryStatus != LotteryStatus.OPEN) {
            revert Lottery__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit LotterEnter(msg.sender);
    }

    /**
     *
     * @dev 只有在彩票状态是开放，且到开奖时间间隔且有玩家参与且彩票池有余额的情况下自动开奖
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (s_lotteryStatus == LotteryStatus.OPEN);
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayer = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayer && hasBalance);
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if (
            (s_lotteryStatus == LotteryStatus.OPEN) &&
            (block.timestamp - s_lastTimeStamp) > i_interval &&
            s_players.length > 0 &&
            address(this).balance > 0
        ) {
            uint256 requestId = i_vrfCoordinator.requestRandomWords(
                i_gasLane,
                i_subscriptionId,
                REQUEST_CONFIRMATIONS,
                i_callbackGasLimit,
                NUM_WORDS
            );
            emit requestedLotteryWinner(requestId);
            s_lotteryStatus = LotteryStatus.CALCULATING;
        } else {
            revert Lottery__UpkeepNotNeeded(
                uint256(s_lotteryStatus),
                s_players.length,
                address(this).balance
            );
        }
    }

    function fulfillRandomWords(
        uint256, // requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        //赢家得到合约账户中的所有余额
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Lottery__TransferFailed();
        }
        emit winnerPicked(recentWinner);
        //重启下一轮
        s_lotteryStatus = LotteryStatus.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
    }

    //获取票价
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    //获取玩家账户
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    //获取当前的赢家
    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    //获取彩票游戏当前状态
    function getLotteryStatus() public view returns (LotteryStatus) {
        return s_lotteryStatus;
    }

    //获取当前设置的中奖人数
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    //获取本轮游戏参与人数
    function getPlayersNumber() public view returns (uint256) {
        return s_players.length;
    }

    //获取本轮游戏开始时间戳
    function getLastTimestamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    //获取生成随机数时的确认块数
    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    //获取抽奖间隔
    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
