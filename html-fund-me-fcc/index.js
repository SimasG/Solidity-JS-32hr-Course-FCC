import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.querySelector("#connectButton");
const fundButton = document.querySelector("#fundButton");
const balanceButton = document.querySelector("#balanceButton");
const withdrawButton = document.querySelector("#withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
  console.log("connect clicked");
  // Verifying that we MetaMask installed in our browser
  // Which is better: "window?.ethereum" or "typeof window.ethereum !== 'undefiend'"?
  if (typeof window.ethereum !== "undefined") {
    console.log("MetaMask detected");
    try {
      // Connecting to MetaMask
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    connectButton.innerHTML = "Connected";
    console.log("Connected to MetaMask!");
  } else {
    console.log("No Metamask ;(");
    connectButton.innerHTML = "Please Install MetaMask!";
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(`Balance: ${ethers.utils.formatEther(balance)}`);
  }
}

async function fund() {
  const ethAmount = document.querySelector("#ethAmount").value;
  console.log(`Funding with ${ethAmount}...`);

  if (typeof window.ethereum !== "undefined") {
    // * In order to make a transaction, we need:
    // * 1.Provider/connection to the blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum); // Connecting with MetaMask (our provider) via ethers.js

    // * 2. Signer/wallet/someone with some gas
    const signer = provider.getSigner(); // Getting wallet/account (signer) object from the provider

    // * 3. Contract we're interacting with (connected with the signer, aka wallet that'll be interacting with the contract)
    // * 4. Contract's ABI & Address
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });

      await listenForTransactionMine(transactionResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.log(error);
    }
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("Withdrawing...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMine(transactionResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.log(error);
    }
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}...`);

  // Returning the resolved promise only once we get the transactionReceipt (which is an async task?) (aka the callback runs)
  return new Promise((resolve, reject) => {
    // "provider.once" event emitter method from ethers.js (https://docs.ethers.io/v5/single-page/#/v5/api/providers/provider/)
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve();
    });
  });
}
