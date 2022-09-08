import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "@typechain/hardhat";
// import "@nomiclabs/hardhat-waffle"; <- let's see if all works well without the "hardhat-waffle" plugin
import "@nomicfoundation/hardhat-chai-matchers"; // <- hardhat's waffle replacement
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
};

export default config;