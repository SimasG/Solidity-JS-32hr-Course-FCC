// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ManualToken {
    // Specifying the exact amount of the total supply of the token
    uint256 initialSupply;

    // A mapping of every address on the chain(s?) to how many tokens they have
    mapping(address => uint256) public balanceOf;

    // A mapping of all addresses that can subtract/add to the original "balanceOf" mapping
    // The first address is (usually or always?) the funds owner who then allows other address(ess?)
    // subtract/borrow/manipulate the funds in other ways
    mapping(address => mapping(address => uint256)) public allowance;

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) public {}

    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` on behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // ** Where does "allowance[_from][msg.sender]" come from?
        require(_value <= allowance[_from][msg.sender]); // Check allowance
        allowance[_from][msg.sender] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }
}
