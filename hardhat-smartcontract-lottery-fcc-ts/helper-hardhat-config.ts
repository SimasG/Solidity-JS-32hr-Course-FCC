import { ethers } from "hardhat";

// ** Fix "any" later
export const networkConfig: any = {
  5: {
    name: "goerli",
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    entranceFee: ethers.utils.parseEther("0.01"),
    fakePayment: ethers.utils.parseEther("0.1"),
    gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subscriptionId: "0", // ** Update with a real one later,
    callbackGasLimit: "500000", // 500,000
    interval: "30", // Seconds
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.utils.parseEther("0.01"),
    fakePayment: ethers.utils.parseEther("0.1"),
    // gasLane on local networks don't matter since we'll be using mocks anyway (still has to be 32 bytes tho?)
    gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    callbackGasLimit: "500000", // 500,000
    interval: "30", // Seconds
  },
};

export const developmentChains = ["hardhat", "localhost"];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
