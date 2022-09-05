// Do I need this 1 default import? It seems so.
import "@nomicfoundation/hardhat-toolbox";

// import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import { task, HardhatUserConfig } from "hardhat/config";

// A custom-made task has to be imported to the hardhat config file to be accessible
import "./tasks/block-number";
import "dotenv/config";
import "solidity-coverage"; // Adds "coverage" task
import "@typechain/hardhat"; // Adds "typechain" task
// import "@nomiclabs/hardhat-ethers";

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

const config: HardhatUserConfig = {
  // By default, hardhat adds: "defaultNetwork: "hardhat"" behind the scenes
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY!],
      chainId: 5,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // "accounts" array automatically set by hardhat
      chainId: 31337, // Even though "localhost" network is different from "hardhat" network, chainId is same
    },
  },
  solidity: "0.8.9",
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    // This will make an API call to coinmarketcap whenever we run the gas reporter
    coinmarketcap: COINMARKETCAP_API_KEY,
    // token: "MATIC", // Shows how much deploying to Polygon would cost (default is ETH mainnet)
  },
};

export default config;
