import { ethers } from "ethers";

// "fs-extra" helps us read our .abi & .bin files
import * as fs from "fs-extra";
import "dotenv/config";

async function main() {
  // will be making API calls to this endpoint
  // connecting to our local Ganache blockchain (or Alchemy endpoint/blockchain?)
  let provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);

  // connecting a wallet from Ganache with a private key
  let wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  //   //   putting the encryptedKey.json info to the encryptedJson variable
  //   const encryptedJson = fs.readFileSync("./.encryptedKey.json", "utf8");

  //   //   creating a wallet with the encryptedJson object(?)
  //   let wallet = new ethers.Wallet.fromEncryptedJsonSync(
  //     encryptedJson,
  //     process.env.PRIVATE_KEY_PASSWORD
  //   );

  //   //   connecting the wallet to our local Ganache blockchain
  //   wallet = await wallet.connect(provider);

  // Private Key is now inaccessible even if the attacker got access to ".encryptedKey.json"
  // The only way to get access to PK is to also know the password, which is only used when running the script
  // e.g. "PRIVATE_KEY_PASSWORD=randompassword node deploy.js"

  // Reading abi & binary synchronously
  const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8"); // "utf8" is the encoding
  const binary = fs.readFileSync(
    "./SimpleStorage_sol_SimpleStorage.bin",
    "utf8"
  );

  // ** SENDING A TRANSACTION USING ETHERS CONTRACT FACTORY
  // creating a "contractFactory" object that can be used to deploy contracts
  // abi -> so our code knows how to interact with the contract
  // binary -> the actual contract compiled into machine code
  // wallet -> so we have a private key we can sign with when deploying this contract
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
  console.log("Deploying, please wait...");

  // Deploying the contract
  const contract = await contractFactory.deploy();
  // We can also customize our contract: e.g. "contractFactory.deploy({gasLimit/gasPrice: 100000000})", etc.

  // You get deployment transaction as soon as you deploy
  // console.log("deployment transaction:", contract.deployTransaction);

  // Getting a transaction receipt after 1 block confirmation
  // const transactionReceipt = await contract.deployTransaction.wait(1);
  await contract.deployTransaction.wait(1);
  // You get receipt when you wait after the contract deployment
  // console.log("transactionReceipt:", transactionReceipt);

  console.log(`Contract Address: ${contract.address}`);

  // **USING FUNCTIONS FROM SIMPLESTORAGE.SOL

  // retrieve number
  // ** retrieve() func won't cost any gas since we're calling it outside of the contract? Don't understand.
  const currentFavoriteNumber = await contract.retrieve(); // using the "retrieve" func fron abi
  // converting the number to string because JS cannot handle numbers
  // with so many decimals (zeros -> billions/trillions, etc.) as in solidity
  console.log(`Current Favorite Number: ${currentFavoriteNumber.toString()}`);

  // store number
  // it's best practice to pass in number arguments as strings (since JS has trouble handling big numbers)
  // Not mandatory to save the number storing into a variable (i.e. "transactionResponse" in this case)
  const transactionResponse = await contract.store("7");

  // Not a mandatory line of code
  const transactionReceipt = await transactionResponse.wait(1);

  // retrieve number again
  const newFavoriteNumber = await contract.retrieve();
  console.log(`New Favorite Number: ${newFavoriteNumber}`);
}

// ** What does "process.exit" really mean?
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
