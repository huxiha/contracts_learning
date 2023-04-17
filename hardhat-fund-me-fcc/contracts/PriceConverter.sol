//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice() internal view returns (uint256) {
        //InterfaceName(Address) return the contract that implement the interface's function
        (
            ,
            /* uint80 roundID */ int256 price /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306)
                .latestRoundData();
        return uint256(price * 1e10);
    }

    function getConversionRate(
        uint256 etherAmount
    ) internal view returns (uint256) {
        uint256 etherPrice = getPrice();
        uint256 etherAmountUSD = (etherAmount * etherPrice) / 1e18;
        return etherAmountUSD;
    }
}
