import { ethers } from "./ethers-5.1.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("MetaMaskConnect");
const fundButton = document.getElementById("Fund");
const getBalanceButton = document.getElementById("getBalance");

connectButton.onclick = connect;
fundButton.onclick = fund;
getBalanceButton.onclick = getBalance;

//连接钱包
async function connect() {
  // 检测环境中是否存在MetaMask
  if (typeof window.ethereum !== "undefined") {
    console.log("I see MetaMask!");
    //连接MetaMask钱包
    await window.ethereum.request({ method: "eth_requestAccounts" });
    console.log("connected!");
    document.getElementById("MetaMaskConnect").innerHTML = "Connected!";
  } else {
    document.getElementById("MetaMaskConnect").innerHTML =
      "Please install MetaMask";
  }
}

//getBalance
async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    document.getElementById("balance").value =
      ethers.utils.formatEther(balance);
  }
}

//fund function
async function fund() {
  const ethAmount = document.getElementById("ethereumAmount").value;
  console.log(`Funding with ${ethAmount}...`);
  if (typeof window.ethereum !== "undefined") {
    //连接到区块链发布了合约的网络
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    //获取合约实例(abi + contract address)
    const contract = new ethers.Contract(contractAddress, abi, signer);
    // 和合约交互
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      //监听交易被Mining
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.error(error);
    }
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}...`);
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
    });
    resolve();
  });
}

//withdraw function
