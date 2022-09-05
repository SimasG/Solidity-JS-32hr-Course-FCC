import { expect } from "chai";
import { ethers } from "hardhat";

// ** Still confusing
import { SimpleStorage__factory, SimpleStorage } from "../typechain-types";

describe("SimpleStorage", function () {
  let SimpleStorageFactory: SimpleStorage__factory;
  let simpleStorage: SimpleStorage;
  beforeEach(async function () {
    SimpleStorageFactory = (await ethers.getContractFactory(
      "SimpleStorage"
    )) as SimpleStorage__factory;
    simpleStorage = await SimpleStorageFactory.deploy();
  });

  it("Should have a favorite number of 0", async function () {
    const currentValue = await simpleStorage.retrieve();
    const expectedValue = "0";
    expect(currentValue).to.equal(expectedValue);
  });

  it("Should update when we call store", async function () {
    const expectedValue = "7";
    const transactionResponse = await simpleStorage.store(expectedValue);
    await transactionResponse.wait(1); // Waiting for 1 block to make sure newValue has been added to the chain
    const newValue = await simpleStorage.retrieve();
    expect(newValue).to.equal(expectedValue);
  });
});
