import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants/index";
// ** Wasn't aware I can also import types from "ethers" (e.g. "BigNumber" or "ContractTransaction")?
import { ethers, BigNumber, ContractTransaction } from "ethers";
import { useNotification } from "web3uikit";
import { AiOutlineBell } from "react-icons/ai";

interface contractAddressesInterface {
  [key: string]: string[];
}

const LotteryEntrance = () => {
  const [entranceFee, setEntranceFee] = useState("0");
  const [numPlayers, setNumPlayers] = useState("0");
  const [recentWinner, setRecentWinner] = useState("0");

  const addresses: contractAddressesInterface = contractAddresses;
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis(); // ** Still don't understand how moralis has access to our "chainId"
  const chainId = parseInt(chainIdHex!);
  // ** Not sure why "string | null" is better for TS than "string | false"
  const raffleAddress =
    chainId in contractAddresses ? addresses[chainId][0] : null;
  const dispatch = useNotification();

  // "runContractFunction" can both send transactions & read state (hence both "enterRaffle" & "getEntranceFee")
  const { runContractFunction: enterRaffle } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress!,
    functionName: "enterRaffle",
    // ** What do params do?
    params: {},
    msgValue: entranceFee,
  });

  const {
    runContractFunction: getEntranceFee,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress!,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress!,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress!,
    functionName: "getRecentWinner",
    params: {},
  });

  const updateUI = async () => {
    // Why from call?
    // Declaring that the resolved values of these promises will be "BigNumber", "BigNumber" & "string"
    const entranceFeeFromCall = (
      (await getEntranceFee()) as BigNumber
    )?.toString();
    const numPlayersFromCall = (
      (await getNumberOfPlayers()) as BigNumber
    ).toString();
    const recentWinnerFromCall = (await getRecentWinner()) as string;

    setEntranceFee(entranceFeeFromCall);
    setNumPlayers(numPlayersFromCall);
    setRecentWinner(recentWinnerFromCall);
  };

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  const handleSuccess = async (tx: ContractTransaction) => {
    await tx.wait(1);
    handleNewNotification();
    updateUI();
  };

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      title: "Tx Notification",
      position: "topR",
      // ** Why can't I increase the icon's size with tailwind after a certain point?
      icon: <AiOutlineBell className="w-8 h-8" />,
    });
  };

  return (
    <div className="p-5">
      <h2>Lottery Entrance</h2>
      {raffleAddress ? (
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            disabled={isLoading || isFetching} // Disabled if "enterRaffle()" is loading/fetching stuff
            onClick={async () => {
              await enterRaffle({
                // ** TS: Why can't I assign a type for callback's tx arg ("tx: ContractTransaction")?
                // "onSuccess" runs once the transaction is successfully sent to our provider/wallet
                // BUT it doesn't wait for the transaction confirmation. That's why we wait for
                // 1 block in "handleSuccess" to ensure the transaction has been confirmed.
                onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
                onError: (error) => console.log(error),
              });
            }}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-6 w-6 border-b-2 rounded-full mx-8"></div>
            ) : (
              <div>Enter Raffle</div>
            )}
          </button>
          <div>
            Entrance Fee:{" "}
            {ethers.utils.formatUnits(entranceFee, "ether").toString()} ETH
          </div>
          <div>Number of Players: {numPlayers}</div>
          <div>Recent Winner: {recentWinner}</div>
        </div>
      ) : (
        <div>No Raffle Address Detected!</div>
      )}
    </div>
  );
};

export default LotteryEntrance;
