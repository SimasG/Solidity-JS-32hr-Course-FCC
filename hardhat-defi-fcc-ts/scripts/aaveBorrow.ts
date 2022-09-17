import { BigNumber } from "ethers";
import { ethers, getNamedAccounts } from "hardhat";
import { ILendingPool } from "../typechain-types";
import getWeth, { AMOUNT } from "./getWeth";

const main = async () => {
  await getWeth();

  const { deployer } = await getNamedAccounts();

  // Depositing into Aave
  const lendingPool = await getLendingPool(deployer);

  const wethTokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  // Approving Aave's Lending Pool to access (aka they take tokens | we deposit them) some of our freshly made tokens
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

  // Depositing to Aave's Lending Pool
  console.log("Depositing...");

  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("Deposited!");

  // Borrowing other tokens using our deposited WETH (collateral)
  let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  const daiPrice = await getDaiPrice();

  const amountDaiToBorrow =
    (parseInt(availableBorrowsETH.toString()) / parseInt(daiPrice.toString())) *
    0.95;

  console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`);

  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // From Etherscan or other block readers
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);

  // Getting another status update of our usage stats after borrowing
  await getBorrowUserData(lendingPool, deployer);

  // Repaying the loan
  await repayDai(
    amountDaiToBorrowWei.toString(),
    daiTokenAddress,
    lendingPool,
    deployer
  );

  // Getting another status update of our usage stats after borrowing
  await getBorrowUserData(lendingPool, deployer);
};

// Fetching Lending Pool contract
const getLendingPool = async (account: string): Promise<ILendingPool> => {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
    // ** Type "string" is not assignable to type "Signer"
    // account
  );

  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();

  // Getting Lending Pool Contract itself
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress
    // ** Type "string" is not assignable to type "Signer"
    // account
  );
  return lendingPool;
};

const approveErc20 = async (
  erc20Address: string,
  spenderAddress: string,
  amountToSpend: string,
  account: string
) => {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address
    // ** Type "string" is not assignable to type "Signer"
    // account
  );

  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!");
};

const getBorrowUserData = async (
  lendingPool: ILendingPool,
  account: string
) => {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH`);

  return { totalDebtETH, availableBorrowsETH };
};

// Getting DAI price
const getDaiPrice = async () => {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );

  const price: BigNumber = (await daiEthPriceFeed.latestRoundData())[1]; // Only getting second item from the list of returned values
  console.log(`DAI/ETH price is ${price.toString()}`);
  return price;
};

// Borrowing DAI
const borrowDai = async (
  daiAddress: string,
  lendingPool: ILendingPool,
  amountDaiToBorrowWei: BigNumber,
  account: string
) => {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    1,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("Borrowed!");
};

// Repaying DAI
const repayDai = async (
  amount: string,
  daiAddress: string,
  lendingPool: ILendingPool,
  account: string
) => {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log("Repaid!");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
