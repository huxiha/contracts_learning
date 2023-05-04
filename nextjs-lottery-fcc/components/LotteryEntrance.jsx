import { useWeb3Contract, useMoralis } from "react-moralis";
import { abi, contractAddress } from "../constants";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "@web3uikit/core";

const LotteryEntrance = () => {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const [entranceFee, setEntranceFee] = useState("0");
  const [playerNumber, setPlayerNumber] = useState("0");
  const [reccentWinner, setReccentWinner] = useState("0");
  const lotteryAddress =
    chainId in contractAddress ? contractAddress[chainId][0] : null;

  const dispatch = useNotification();

  const {
    runContractFunction: entryLottery,
    isFetching,
    isLoading,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "entryLottery",
    params: {},
    msgValue: entranceFee,
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getPlayersNumber } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getPlayersNumber",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  async function updateUI() {
    const entranceFeeFromCall = (await getEntranceFee()).toString();
    const playerNumberFromCall = (await getPlayersNumber()).toString();
    const recentWinnerFromCall = (await getRecentWinner()).toString();
    setEntranceFee(entranceFeeFromCall);
    setPlayerNumber(playerNumberFromCall);
    setReccentWinner(recentWinnerFromCall);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    updateUI();
    handleNewNotification(tx);
  };

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "transaction complete!",
      title: "Tx Notification",
      position: "topR",
      icon: "bell",
    });
  };

  return (
    <div className="px-8 py-6">
      {lotteryAddress ? (
        <div>
          <p>
            Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")}ETH
          </p>
          <button
            className="px-2 py-1 my-2 text-white bg-blue-400 rounded-md"
            onClick={async () => {
              await entryLottery({
                onSuccess: handleSuccess,
                onError: (error) => console.log(error),
              });
            }}
            disabled={isFetching || isLoading}
          >
            Entry Lottery
          </button>
          <p>Players Number: {playerNumber}</p>
          <p>Recent winner: {reccentWinner}</p>
        </div>
      ) : (
        <p>No lottery address deteched!</p>
      )}
    </div>
  );
};

export default LotteryEntrance;
