// ** Don't think we're even using this script?
import { ethers } from "hardhat";

const enterRaffle = async () => {
  const raffle = await ethers.getContract("Raffle");
  const entranceFee = await raffle.getEntranceFee();
  await raffle.enterRaffle({ value: entranceFee + 1 });
  console.log("Entered!");
};

enterRaffle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
