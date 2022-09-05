        actually withdrawing the funds. there are 3 methds:
        // 1. Transfer
        // changing the data type from address to payable address
        // we can only make transactions with payable address data types
        payable(msg.sender).transfer(address(this).balance);

        // 2. Send
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // we have to add the "require" because "send" doesn't throw errors if
        // unsuccessful. instead if returns a boolean
        // if sendSuccess = false, throw error "Send failed!";
        require(sendSuccess, "Send failed!");

        // 3. Call
        // with "call", we can both value AND calldata "("")"
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
