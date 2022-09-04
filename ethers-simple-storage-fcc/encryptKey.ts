import { ethers } from "ethers";

// "fs-extra" helps us read our .abi & .bin files
import * as fs from "fs-extra";
import "dotenv/config";

async function main() {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
  //   creating an encrypted json file that can only be encrypted back to a private key with a password
  const encryptedJsonKey = await wallet.encrypt(
    process.env.PRIVATE_KEY_PASSWORD!,
    process.env.PRIVATE_KEY
  );
  // saving "encryptedJson" to a new file
  fs.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
