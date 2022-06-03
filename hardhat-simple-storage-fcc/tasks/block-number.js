const { task } = require("hardhat/config");

task("block-number", "Prints the current block number").setAction(
  // "hre" is a hardhat runtime env and acts similar to "require(hardhat)" -> it can access
  // a lot of the same packages that "required(hardhat)" can
  async (taskArgs, hre) => {
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
  }
);

module.exports = {};
