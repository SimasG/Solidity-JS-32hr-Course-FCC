// * Wrapping our ether: depositing our ETH for WETH
// @ts-ignore
import { ethers, getNamedAccounts } from "hardhat";
import { Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

export const AMOUNT = ethers.utils.parseEther("0.02").toString();

const getWeth = async () => {
  const { deployer } = await getNamedAccounts();

  // * Accessing the WETH contract (that is also an ERC20 token) to call their "deposit()" func
  const iWeth = await ethers.getContractAt(
    // ABI generated from "IWeth.sol" interface
    "IWeth",
    // WETH contract address on mainnet
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    // Address that will be connected to the WETH contract (us) -> IS THIS LINE EVEN NECESSARY?
    // ** Broken line below
    // deployer as unknown as Signer
  );

  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`Got ${wethBalance.toString()} WETH`);
};

export default getWeth;
