import { BigNumber } from "ethers";
import { ethers, getNamedAccounts } from "hardhat";
import { ILendingPool } from "../typechain-types";
import getWeth, { AMOUNT } from "./getWeth";

const main = async () => {
  // * Getting WETH
  await getWeth();

  const { deployer } = await getNamedAccounts();

  // * Depositing into Aave
  // For that, we need to interact with Aave's Lending Pool contract. For that, we need:
  // 1. Lending Pool address (via "lendingPoolAddressesProvider")
  // ** What about this address: 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9?
  // ** It's identical to the one we get from "getLendingPool()"
  // Lending Pool Addresses Provider contract address: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // 2. ABI (can get it by either copying the raw ABI or contract's interface (& compiling it) from Aave)

  const lendingPool = await getLendingPool(deployer);
  // ** !These two are identical! **
  // console.log(`Lending pool address: ${lendingPool.address}`);
  // console.log(
  //   `Lending pool address on Aave (raw): 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9`
  // );

  const wethTokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  // * Approving Aave's Lending Pool to access (aka they take tokens | we deposit them) some of our freshly made tokens
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

  // * Depositing to Aave's Lending Pool
  console.log("Depositing...");
  // "wethTokenAddress" -> address of the token we want to deposit
  // "deployer" -> account address on whose behalf we deposit (ourselves)
  // "0" -> referral code (discontinued)

  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0); // "deposit()" -> from "@aave/protocol-v2"
  console.log("Deposited!");

  // * Borrowing other tokens using our deposited WETH (collateral)
  // Here we want to track:
  // 1. How much we borrowed (its value)
  // 2. How much collateral we have (its value)
  // 3. How much more we could borrow
  // 4. Since we want to borrow DAI, we need to find out what the ETH/DAI conversion rate is
  let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  const daiPrice = await getDaiPrice();
  // 1 DAI = 0,000625335185351175 ETH
  // 1 ETH = 1599.142385 DAI

  // How much we can borrow in DAI
  // ** Amount is "26" but isn't it supposed to be more granular (calculators say "26.38584936")?
  // const amountDaiToBorrow = availableBorrowsETH.div(daiPrice); // BigNumber math syntax -> very inaccurate

  // ** How much WEI we need to borrow the above mentioned amount of DAI? Not really, seems wrong..
  // const amountDaiToBorrowWei = ethers.utils.parseEther(
  //   amountDaiToBorrow.toString()
  // );

  // ** These calculations give "26.385849359706107" DAI
  const amountDaiToBorrow =
    (parseInt(availableBorrowsETH.toString()) / parseInt(daiPrice.toString())) *
    0.95; // Why "0.95"? For 5% additional safety? Yes

  console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`); // 25.066556891720800000

  // Transforming "amountDaiToBorrow" back into a BigNumber format (confusing var naming imo)
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // From Etherscan or other block readers
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);

  // Getting another status update of our usage stats after borrowing
  await getBorrowUserData(lendingPool, deployer);

  // * Repaying (part of the) loan
  await repayDai(
    amountDaiToBorrowWei.toString(),
    daiTokenAddress,
    lendingPool,
    deployer
  );

  // Getting another status update of our usage stats after borrowing
  await getBorrowUserData(lendingPool, deployer);

  // After repaying the loan, we still have DAI that we owe (interest). Patrick recommends
  // exchanging our ETH for DAI in a DEX (e.g. Uniswap) to pay back the remainder
  // * We could also programmatically repay the interest (taking Uniswap's interface, etc. etc.)
};

// * Fetching Lending Pool contract. Things needed:
// 1. Lending Pool Addresses Provider contract address: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5 (from Aave docs)
// 2. Lending Pool Addresses Provider ABI (can get it by either copying the raw ABI or contract's interface (& compiling it) from Aave)
// "account" is the "deployer" address
const getLendingPool = async (account: string) => {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
    // ** Again, type "string" is not assignable to type "Signer"
    // account
  );

  // Getting Lending Pool Contract Address
  // This "getLendingPool()" comes from "ILendingPoolAddressesProvider" interface at
  // "node_modules/@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol"
  // it's *different from the "getLendingPool()" func we're building
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();

  // Getting Lending Pool Contract itself
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress
    // ** Again, type "string" is not assignable to type "Signer"
    // account
  );
  return lendingPool;
};

// ** "erc20Address" -> address of the weth contract on mainnet (not really sure what this does)
// "spenderAddress" -> address of the contract we will give approval to spend our funds
// "account" -> our deployer account to do all these operations on (right?)
const approveErc20 = async (
  erc20Address: string,
  spenderAddress: string,
  amountToSpend: string,
  account: string
) => {
  // Getting "erc20Token" contract
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address
    // ** Again, type "string" is not assignable to type "Signer"
    // account
  );

  // "approve()" -> from "@aave/protocol-v2"
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!");
};

// "lendingPool" -> the Lending Pool contract
// "account" -> the address (that has interacted with Aave) whose data we want to get
const getBorrowUserData = async (
  lendingPool: ILendingPool,
  account: string
) => {
  // "getUserAccountData()" -> from "@aave/protocol-v2"
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  // "totalCollateralETH = totalDebtETH + availableBorrowsETH", right?
  console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH`);

  return { totalDebtETH, availableBorrowsETH };
};

// Getting DAI price
const getDaiPrice = async () => {
  // Getting "daiEthPriceFeed" contract
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    // Chainlink's contract address of DAI/ETH on mainnet
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
    // Since we're only reading from this contract (not sending any transactions to it), we don't
    // need a signer (aka connecting it to our "deployer" address is not necessary)
  );

  const price: BigNumber = (await daiEthPriceFeed.latestRoundData())[1]; // Only getting second item from the list of returned values
  console.log(`DAI/ETH price is ${price.toString()}`);
  return price;
};

// Borrowing DAI
const borrowDai = async (
  // Address of the asset/token contract we want to borrow (DAI in this case)
  daiAddress: string,
  // Lending pool contract from which we'll borrow
  lendingPool: ILendingPool,
  // Amount of DAI we want to borrow (in WEI/BigNumber format)
  amountDaiToBorrowWei: BigNumber,
  // Address of the account we want to borrow with (us)
  account: string
) => {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    // Interest rate mode -> 1: stable, 2: variable
    1,
    // Referral code -> 0 since it's discontinued
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("Borrowed!");
};

// Repaying DAI
// Hard-naming this func "repayDai" instead of "repay" to avoid confusion when
// using ILendingPool's "repay" func inside
const repayDai = async (
  amount: string,
  daiAddress: string,
  lendingPool: ILendingPool,
  account: string
) => {
  // Approving Aave to interact with our contract again (aka take our DAI)
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  // "1" -> stable interest rate (right?)
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
