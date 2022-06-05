const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
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
};

module.exports = { verify };
