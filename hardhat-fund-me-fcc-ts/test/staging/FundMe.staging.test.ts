// Tests we run after deploying on a testnet (live)

import { assert } from "chai";
import { ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

// If we're on a development chain (hardhat/localhost), don't run these tests
developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe: FundMe;
      let deployer: any;
      const sendValue = ethers.utils.parseEther("0.1");
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      // Funder & deployer is the same address in this case
      it("Allows the contract deployer to fund & withdraw from the contract", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw({
          gasLimit: 100000,
        });
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
