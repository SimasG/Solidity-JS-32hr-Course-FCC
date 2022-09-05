// "run" allows us to run any hardhat task
// "network" provides network configuration info
import { ethers, run, network } from "hardhat";

const main = async () => {
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("Deploying contract...");

  // By default, we're using the fake hardhat network. Hence, we already have default Private Key & RPC_URL set

  // Deploying the contract
  const simpleStorage = await SimpleStorageFactory.deploy();

  // Not sure what this line is for. Aren't we awaiting the contract deployment already?
  await simpleStorage.deployed();
  console.log(`Deployed contract to: ${simpleStorage.address}`);

  // Run if chain we're deploying on is Goerli & we have an Etherscan API key (that'll enable auto verify)
  if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
    // Waiting for 6 blocks to verify the transaction since it usually takes at least 20-30 sec for the
    // deployed contracts to display on Etherscan. We don't want to try to verify a contract that isn't yet
    // in Etherscan's database
    await simpleStorage.deployTransaction.wait(6);
    console.log("Waiting for block txes...");

    await verify(simpleStorage.address, []);
  }

  // Interacting with the contract
  const currentValue = await simpleStorage.retrieve();
  console.log("currentValue:", currentValue.toString());

  const transactionResponse = await simpleStorage.store(7);
  await transactionResponse.wait(1);

  const updatedValue = await simpleStorage.retrieve();
  console.log("updatedValue:", updatedValue.toString());
};

// Automatically verifying our contract
const verify = async (contractAddress: string, args: any[]) => {
  console.log("Verifying contract...");
  // Argument 1: specifying the subtask of "verify" (happens to also be called "verify" this time)
  // Argument 2: Object of verification parameters
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArgs: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
