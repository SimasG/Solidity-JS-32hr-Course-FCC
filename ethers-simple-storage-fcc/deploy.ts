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

  //   Private Key is now inaccessible even if the attacker got access to ".encryptedKey.json"
  // The only way to get access to PK is to also know the password, which is only used when running the script
  // e.g. "PRIVATE_KEY_PASSWORD=randompassword node deploy.js"

  // Reading abi & binary synchronously
  const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8"); // "utf8" is the encoding
  const binary = fs.readFileSync(
    "./SimpleStorage_sol_SimpleStorage.bin",
    "utf8"
  );

  //**SENDING A TRANSACTION USING ETHERS CONTRACT FACTORY
  // creating a "contractFactory" object that can be used to deploy contracts
  // abi -> so our code knows how to interact with the contract
  // binary -> the actual contract compiled into machine code
  // wallet -> so we have a private key we can sign with when deploying this contract
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
  console.log("Deploying, please wait...");

  // Deploying the contract
  const contract = await contractFactory.deploy();
  console.log(contract);

  // // Getting a transaction receipt after 1 block confirmation
  // await contract.deployTransaction.wait(1);
  // console.log(`Contract Address: ${contract.address}`);

  // //   **USING FUNCTIONS FROM SIMPLESTORAGE.SOL

  // //   retrieve number
  // const currentFavoriteNumber = await contract.retrieve(); // using the "retrieve" func fron abi
  // //   converting the number to string because JS cannot handle numbers
  // // with so many decimals as in solidity
  // console.log(`Current Favorite Number: ${currentFavoriteNumber.toString()}`);

  // //   store number
  // const transactionResponse = await contract.store("7");
  // const transactionReceipt = await transactionResponse.wait(1);

  // //   retrieve number again
  // const newFavoriteNumber = await contract.retrieve();
  // console.log(`New Favorite Number: ${newFavoriteNumber}`);
}

// ** What does "process.exit" really mean?
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
