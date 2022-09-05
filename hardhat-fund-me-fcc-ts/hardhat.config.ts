import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

const config: HardhatUserConfig = {
  // By default, hardhat adds: "defaultNetwork: "hardhat"" behind the scenes
  defaultNetwork: "hardhat",
  networks: {
    // ** Smth doesn't work with Goerli ("Invalid account: #0 for network: goerli - private key too short, expected 32 bytes")
    // goerli: {
    //   url: GOERLI_RPC_URL,
    //   accounts: [PRIVATE_KEY!],
    //   chainId: 5,
    // },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // "accounts" array automatically set by hardhat
      chainId: 31337, // Even though "localhost" network is different from "hardhat" network, chainId is same
    },
  },
  // solidity: "0.8.8",
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
  },
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
  // Naming accounts in the "accounts" array for any network we're working with
  namedAccounts: {
    deployer: {
      default: 0, // For hardhat network, the deployer account will be "accounts[0]"
      // 5: 1, // For Goerli testnet, the deployer account would be "accounts[0]?"
      // 31337: 2, // For localhost network, the deployer accounts would be "accounts[2]"?
    },
    user: {
      default: 1,
    },
  },
};

export default config;
