// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultToken is ERC20, Ownable {
    uint256 public immutable nftId;
    address public immutable nftContract;
    
    constructor(
        uint256 _nftId,
        address _nftContract,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        address _creator
    ) ERC20(_name, _symbol) {
        nftId = _nftId;
        nftContract = _nftContract;
        _mint(_creator, _totalSupply);
        _transferOwnership(_creator);
    }
    
    function decimals() public pure override returns (uint8) {
        return 0; // No decimal places for share tokens
    }
    
    // Only allow the NFT contract to mint additional tokens if needed
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    // Allow burning tokens to potentially reclaim full NFT ownership
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    // Get the percentage ownership of an address
    function getOwnershipPercentage(address account) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(account) * 100) / totalSupply();
    }
}
