import { ethers, network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  developmentChains,
  networkConfig,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config";
import verify from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("3");

const deployRaffle = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  // Accessing "deployer" address from "namedAccounts" object in "hardhat.config.ts"
  // (address is not even specified there since it's on a hardhat network)
  const { deployer } = await getNamedAccounts();

  let VRFCoordinatorV2MockAddress; // Raffle constructor argument 1
  let subscriptionId; // Raffle constructor argument 4

  if (developmentChains.includes(network.name)) {
    const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    VRFCoordinatorV2MockAddress = VRFCoordinatorV2Mock.address;

    // Creating a fake VRF subscription (using "VRFCoordinatorV2Mock")
    const transactionResponse = await VRFCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId; // fake subscriptionId created taken care of "VRFCoordinatorV2Mock"

    // Funding the subscription -> "VRFCoordinatorV2Mock" lets us fund it without LINK
    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
  } else {
    VRFCoordinatorV2MockAddress = networkConfig[network.config.chainId!].vrfCoordinatorV2;
    subscriptionId = networkConfig[network.config.chainId!].subscriptionId;
  }

  const fakePayment = networkConfig[network.config.chainId!].fakePayment;
  const entranceFee = networkConfig[network.config.chainId!].entranceFee; // Raffle constructor argument 2
  const gasLane = networkConfig[network.config.chainId!].gasLane; // Raffle constructor argument 3
  const callbackGasLimit = networkConfig[network.config.chainId!].callbackGasLimit; // Raffle constructor argument 5
  const interval = networkConfig[network.config.chainId!].interval; // Raffle constructor argument 6

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1 // ** Shouldn't it be 0?
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const args = [
    VRFCoordinatorV2MockAddress,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
    fakePayment,
  ];

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args, // Array of arguments being passed into the constructor
    log: true,
    waitConfirmations: waitBlockConfirmations, // Giving etherscan time to index our transaction
  });

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...");
    await verify(raffle.address, args);
  }
  log("------------------------------------");
};

export default deployRaffle;

deployRaffle.tags = ["all", "raffle"];
