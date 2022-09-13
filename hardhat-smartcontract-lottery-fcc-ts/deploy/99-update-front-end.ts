/* Dynamically update our "contractAddresses.json" & "abi.json" constants files in the frontend */
/* Whenever we (re)deploy our smart contracts ("hh deploy") or run a node ("hh node"), this script will run */

import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
// "fs" is a Node.js File System for reading/creating/updating/deleting files on your local machine
import fs from "fs-extra";

const FRONT_END_ADDRESSES_FILE =
  "../nextjs-smartcontract-lottery-fcc-ts/constants/contractAddresses.json";
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery-fcc-ts/constants/abi.json";

const updateUI: DeployFunction = async () => {
  // ** Don't understand this "if"
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end...");
    updateContractAddresses();
    updateAbi();
  }
};

// Updating our contract address for each chain (network) we deploy on
const updateContractAddresses = async () => {
  const raffle = await ethers.getContract("Raffle");
  const chainId = network.config.chainId?.toString();

  // Reading the "contractAddresses.json" file from the frontend
  const contractAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"));

  // If the same key as "chainId" exists in the "contractAddresses" object. E.g.:
  // "const car = { make: 'Honda', model: 'Accord', year: 1998 };
  // console.log('make' in car);
  // expected output: true"
  if (chainId! in contractAddresses) {
    if (!contractAddresses[chainId!].includes(raffle.address)) {
      contractAddresses[chainId!].push(raffle.address);
    }
  } else {
    contractAddresses[chainId!] = [raffle.address];
  }

  // Updating the "contractAddresses.json" file on our frontend
  fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(contractAddresses));
};

const updateAbi = async () => {
  // ** Fix the "any" here
  const raffle: any = await ethers.getContract("Raffle");
  // fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json));
  fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json));
};

export default updateUI;

// ** Why do we need these tags here?
updateUI.tags = ["all", "frontend"];
