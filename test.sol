pragma solidity ^0.8.0;

contract Demo {
    uint256 public total;
    event Updated(uint256 val);

    function bad(uint[] memory arr) public {
        for (uint i = 0; i < arr.length; i++) {
            total += arr[i]; // storage read + write
            emit Updated(total); // emit inside loop
        }

        uint x = total;
        uint y = total; // redundant SLOAD
    }
}