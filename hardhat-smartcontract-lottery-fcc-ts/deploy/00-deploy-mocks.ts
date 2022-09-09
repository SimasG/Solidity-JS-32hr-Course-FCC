import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../helper-hardhat-config";

// 0.25 LINK is the premium. We pay that for each request for a random number (sooo expensive)
const BASE_FEE = ethers.utils.parseEther("0.25"); // Even though we're parsing LINK
const GAS_PRICE_LINK = 1e9; // Calculated value based on the gas price on the Chainlink

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks..");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
    log("Mocks deployed!");
    log("------------------------------------------------");
  }
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];
