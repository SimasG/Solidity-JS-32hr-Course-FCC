// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Inheriting ERC721 contract (JS classes version: "class BasicNft extends ERC721")
contract BasicNft is ERC721 {
    string public constant TOKEN_URI = "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
    uint256 private s_tokenCounter;

    // Arg 1: NFT name | Arg 2: NFT symbol
    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0; // Either way, uints get auto initialized to 0 as their default value
    }

    function mintNft() public returns (uint256) {
        // Arg 1: Address of the account that will mint and hence own the minted NFT
        // Arg 2: Token Id (every NFT must have a unique id connected to it)
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    };

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
};