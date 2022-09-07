import { ethers, getNamedAccounts } from "hardhat";

async function main() {
  const { deployer } = await getNamedAccounts();
  // Getting the most recently deployed FundMe contract + connecting it to deployer address
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Withdrawing from the contract...");
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);
  console.log("Withdrawn!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
