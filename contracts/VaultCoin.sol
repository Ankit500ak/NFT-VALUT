// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract VaultCoin is ERC20, Ownable, Pausable, ReentrancyGuard {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18; // 10 million tokens max
    uint256 public constant NEW_USER_BONUS = 20 * 10**18; // 20 VAULT tokens for new users
    
    // User registration tracking
    mapping(address => bool) public hasReceivedBonus;
    mapping(address => uint256) public registrationTime;
    
    // Fiat gateway integration
    mapping(address => bool) public authorizedGateways;
    mapping(bytes32 => bool) public processedTransactions;
    
    // Governance
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event FiatPurchase(address indexed buyer, uint256 amount, bytes32 transactionId);
    event GatewayAuthorized(address indexed gateway, bool authorized);
    event NewUserRegistered(address indexed user, uint256 bonusAmount);
    event VotingPowerUpdated(address indexed user, uint256 newPower);
    
    modifier onlyAuthorizedGateway() {
        require(authorizedGateways[msg.sender], "Not authorized gateway");
        _;
    }
    
    constructor() ERC20("VaultCoin", "VAULT") {
        _mint(msg.sender, INITIAL_SUPPLY);
        _transferOwnership(msg.sender);
        emit TokensMinted(msg.sender, INITIAL_SUPPLY);
    }
    
    function registerUser(address user) external nonReentrant whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(!hasReceivedBonus[user], "User already registered");
        require(totalSupply() + NEW_USER_BONUS <= MAX_SUPPLY, "Exceeds max supply");
        
        hasReceivedBonus[user] = true;
        registrationTime[user] = block.timestamp;
        
        _mint(user, NEW_USER_BONUS);
        _updateVotingPower(user, balanceOf(user));
        
        emit NewUserRegistered(user, NEW_USER_BONUS);
        emit TokensMinted(user, NEW_USER_BONUS);
    }
    
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        _updateVotingPower(to, balanceOf(to));
        emit TokensMinted(to, amount);
    }
    
    function mintFromFiat(
        address to, 
        uint256 amount, 
        bytes32 transactionId
    ) external onlyAuthorizedGateway whenNotPaused nonReentrant {
        require(!processedTransactions[transactionId], "Transaction already processed");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        processedTransactions[transactionId] = true;
        _mint(to, amount);
        _updateVotingPower(to, balanceOf(to));
        
        emit TokensMinted(to, amount);
        emit FiatPurchase(to, amount, transactionId);
    }
    
    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
        _updateVotingPower(msg.sender, balanceOf(msg.sender));
        emit TokensBurned(msg.sender, amount);
    }
    
    function _updateVotingPower(address user, uint256 newBalance) internal {
        uint256 oldPower = votingPower[user];
        uint256 newPower = _calculateVotingPower(newBalance);
        
        votingPower[user] = newPower;
        totalVotingPower = totalVotingPower - oldPower + newPower;
        
        emit VotingPowerUpdated(user, newPower);
    }
    
    function _calculateVotingPower(uint256 balance) internal pure returns (uint256) {
        // Square root voting power to prevent whale dominance
        return sqrt(balance / 10**18);
    }
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        bool result = super.transfer(to, amount);
        if (result) {
            _updateVotingPower(msg.sender, balanceOf(msg.sender));
            _updateVotingPower(to, balanceOf(to));
        }
        return result;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool result = super.transferFrom(from, to, amount);
        if (result) {
            _updateVotingPower(from, balanceOf(from));
            _updateVotingPower(to, balanceOf(to));
        }
        return result;
    }
    
    function authorizeGateway(address gateway, bool authorized) external onlyOwner {
        authorizedGateways[gateway] = authorized;
        emit GatewayAuthorized(gateway, authorized);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
