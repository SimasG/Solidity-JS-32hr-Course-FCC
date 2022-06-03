// "run" allows to manually run any hardhat task/method
const { ethers, run, network } = require("hardhat");

async function main() {
  // **don't understand this part
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("Deploying contract...");
  const simpleStorage = await SimpleStorageFactory.deploy();
  await simpleStorage.deployed();
  console.log(`Contract deployed to: ${simpleStorage.address}`);

  //   verifying our contract if we're on a testnet (not a local dev env like hardhat or ganache)
  if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
    //   waiting for 6 block transactions before verifying our contract to make sure the
    // contract is indexed in Etherscan
    console.log("Waiting for block txes...");
    await simpleStorage.deployTransaction.wait(6);
    await verify(simpleStorage.address, []);
  }

  //   manipulating contract values/functions
  const currentValue = await simpleStorage.retrieve();
  console.log(`Current value is ${currentValue}`);

  const transactionResponse = await simpleStorage.store(7);
  await transactionResponse.wait(1);
  const updatedValue = await simpleStorage.retrieve();
  console.log(`Updated value is ${updatedValue}`);
}

async function verify(contractAddress, args) {
  // **don't understand why it's necessarily "verify:verify"

  // wrapping the verification in a try/catch block in case etherscan verifies the contract themselves
  // before us -> because then we'd get an error
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
