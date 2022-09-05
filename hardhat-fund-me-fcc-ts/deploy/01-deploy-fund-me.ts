import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import verify from "../utils/verify";

const deployFundMe = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;
  const chainId = network.config.chainId;

  // Dynamically getting the price feed address depending on the chain we use
  // const ethUsdPriceFeedAddress = networkConfig.chainId["ethUsdPriceFeed"];

  let ethUsdPriceFeedAddress: string;
  if (developmentChains.includes(network.name)) {
    // Getting an address of the most recently deployed (specified) contract
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig.chainId["ethUsdPriceFeed"];
  }

  // When deploying to hardhat/localhost network, we want to use a mock (since we can't get
  // ETH/USD price from chainlink in these networks)

  // If the contract doesn't exist (e.g. for hardhat/localhost chains it won't), deploy a minimal
  // version of it for our local testing

  // With hardhat-deploy, we don't need to deploy a contract using a contract factory anymore
  // Arg 1: name of the .sol file we want to deploy | Arg 2: object of override configs
  const args = [ethUsdPriceFeedAddress];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // Array of arguments being passed into the constructor
    log: true, // Enabling some automatic console logging (to avoid console logging everything manually)
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("----------------------------------------------------------------------");
};

export default deployFundMe;

deployFundMe.tags = ["all", "fundMe"];
// ** Or should it be "export const tags = ["all", "fundMe"]"?
