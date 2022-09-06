import { run } from "hardhat";

// Automatically verifying our contract
const verify = async (contractAddress: string, args: any[]) => {
  console.log("Verifying contract...");
  // Argument 1: specifying the subtask of "verify" (happens to also be called "verify" this time)
  // Argument 2: Object of verification parameters
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

export default verify;
