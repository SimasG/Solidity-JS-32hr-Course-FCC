const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

describe("SimpleStorage", function () {
  let simpleStorageFactory, simpleStorage;

  // specifying what we'll do before each test
  beforeEach(async function () {
    simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await simpleStorageFactory.deploy();
  });

  // describes what the test should do + writing code that would achieve the desired result
  it("Should start with a favorite number of 0", async function () {
    const currentValue = await simpleStorage.retrieve();
    const expectedValue = "0";

    // checking if the currentValue is the same as the expectedValue
    assert.equal(currentValue.toString(), expectedValue);
  });

  it("Should update to 7 when we call store", async function () {
    const expectedValue = "7";
    const transactionResponse = await simpleStorage.store(expectedValue);
    await transactionResponse.wait(1);
    const updatedValue = await simpleStorage.retrieve();

    assert.equal(updatedValue.toString(), expectedValue);
  });
});
