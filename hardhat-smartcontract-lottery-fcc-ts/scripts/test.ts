import { getNamedAccounts } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function deployRaffle() {
  const namedAccounts = await getNamedAccounts();
  console.log("namedAccounts:", namedAccounts);
}

deployRaffle();
