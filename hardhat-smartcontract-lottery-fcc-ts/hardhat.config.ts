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

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      // blockConfirmations: 1, // ** Shouldn't it just be 0 since we're on a local fake network (no need to wait for Etherscan indexing)?
    },
    goerli: {
      chainId: 5,
      // blockConfirmations: 5,
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY!],
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // "accounts" array automatically set by hardhat
      chainId: 31337, // Even though "localhost" network is different from "hardhat" network, chainId is same
    },
  },
  etherscan: {
    // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    noColors: true,
    outputFile: "gas-report.txt",
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  solidity: "0.8.9",
  namedAccounts: {
    deployer: {
      default: 0, // For hardhat network, the deployer account will be "accounts[0]"
    },
    player: {
      default: 1, // For hardhat network, the player account will be "accounts[1]"
    },
  },
  mocha: {
    timeout: 200000, // 200 seconds max
  },
};

export default config;
