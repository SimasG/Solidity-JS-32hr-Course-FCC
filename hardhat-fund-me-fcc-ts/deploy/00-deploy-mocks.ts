import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";

const DECIMALS = "18";
const INITIAL_PRICE = "2000000000000000000000"; // 2000

// Deploying mocks for FundMe contract
const deployMocks = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");

    // ** Fix below TS
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    });
    log("Mocks deployed!");
    log("--------------------------------------------------------------------");
  }
};

export default deployMocks;

deployMocks.tags = ["all", "mocks"];
// ** Or should it be "export const tags = ["all", "mocks"]"?
