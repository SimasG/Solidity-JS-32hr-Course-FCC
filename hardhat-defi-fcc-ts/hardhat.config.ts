import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "@typechain/hardhat";
import "@nomicfoundation/hardhat-chai-matchers"; // <- hardhat's waffle replacement
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import "solidity-coverage";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// 0.020000000000000000

// ** TS: Fix "any" later -> not allowing to add "namedAccounts" to config
const config: any = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      // gasPrice: 130000000000,
      forking: {
        url: MAINNET_RPC_URL,
      },
    },
    goerli: {
      chainId: 5,
      // blockConfirmations: 5,
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY!],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.6.12", // For "ILendingPoolAddressProvider.sol" interface
      },
      {
        version: "0.4.19", // For "IWeth.sol" interface
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // For hardhat network, the deployer account will be "accounts[0]"
    },
    player: {
      default: 1, // For hardhat network, the deployer account will be "accounts[1]"
    },
  },
  // namedAccounts: {
  //   deployer: {
  //     default: 0, // here this will by default take the first account as deployer
  //     1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
  //   },
  // },
};

export default config;
