// Getting the current block number of whichever blockchain we're working with
import { task } from "hardhat/config";

export default task(
  "block-number",
  "Prints the current block number"
).setAction(
  // "hre" (HardhatRuntimeEnvironment) is similar to importing ethers from the hardhat package itself -> similar methods allowed
  async (taskArgs, hre) => {
    // await console.log("hre:", hre);
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
  }
);
