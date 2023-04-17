//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./PriceConverter.sol";

//Get funds from users
//Withdraw funds
//Set a minimum funding value

error NotOwner();

contract FundMe {
    //some tricks to let the transaction gas down
    //858465

    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 0.05 * 1e18; //after add keyword constant,the transaction gas:838091
    address[] public funders;
    mapping(address => uint256) public addressToValue;

    address public immutable i_owner; //the owner of this contract

    //after add keyword immutable,the transaction gas down to 814620
    constructor() {
        i_owner = msg.sender; //who deploy this contract
    }

    function fund() public payable {
        // the sending value should greater than 1e18,or this transaction will revert with the error
        // require(getConversionRate(msg.value) >= MINIMUM_USD, "Didn't send enough!");
        require(
            msg.value.getConversionRate() >= MINIMUM_USD,
            "Didn't send enough!"
        ); //use the library for uint256
        funders.push(msg.sender);
        addressToValue[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        // require(msg.sender == i_owner, "Sender is not the owner!");//only the contract owner can call this function

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funderAddress = funders[funderIndex];
            addressToValue[funderAddress] = 0;
        }
        //reset the array
        funders = new address[](0);

        //withdraw the funds
        //three way to send value
        //transfer
        // payable(msg.sender).transfer(address(this).balance);//if the transfer fail,this will revert
        //send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);//if the send fail,this will not revert,just return false
        // require(sendSuccess, "send fail");//if send fail ,using this way to revert
        //call
        (bool callSuccess /*bytes returnedData*/, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call fail");
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not the owner!");
        if (msg.sender != i_owner) {
            revert NotOwner();
        }
        _; //do the rest function code
    }

    // what happen if someone send eth to this contract withour calling fund function?
    // we can still trigger some code
    // a special function in solidity called receive(),fallback()
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
