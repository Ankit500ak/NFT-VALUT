// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./VaultCoin.sol";

contract FiatGateway is Ownable, ReentrancyGuard, Pausable {
    VaultCoin public vaultCoin;
    
    // Exchange rates (in wei per USD cent)
    uint256 public usdToVaultRate = 1 * 10**18; // 1 VAULT = 1 USD
    
    // Minimum and maximum purchase amounts (in USD cents)
    uint256 public minPurchaseAmount = 1000; // $10.00
    uint256 public maxPurchaseAmount = 1000000; // $10,000.00
    
    // Authorized payment processors
    mapping(address => bool) public authorizedProcessors;
    
    // Transaction tracking
    mapping(bytes32 => bool) public processedTransactions;
    mapping(address => uint256) public userPurchaseHistory;
    
    struct PurchaseOrder {
        address buyer;
        uint256 usdAmount; // in cents
        uint256 vaultAmount;
        bytes32 transactionId;
        uint256 timestamp;
        bool completed;
    }
    
    mapping(bytes32 => PurchaseOrder) public purchaseOrders;
    
    event PurchaseInitiated(
        bytes32 indexed transactionId,
        address indexed buyer,
        uint256 usdAmount,
        uint256 vaultAmount,
        uint256 timestamp
    );
    
    event PurchaseCompleted(
        bytes32 indexed transactionId,
        address indexed buyer,
        uint256 vaultAmount,
        uint256 timestamp
    );
    
    event ExchangeRateUpdated(uint256 newRate, uint256 timestamp);
    event ProcessorAuthorized(address indexed processor, bool authorized);
    
    modifier onlyAuthorizedProcessor() {
        require(authorizedProcessors[msg.sender], "Not authorized processor");
        _;
    }
    
    constructor(address _vaultCoin) {
        vaultCoin = VaultCoin(payable(_vaultCoin));
        _transferOwnership(msg.sender);
    }
    
    function initiatePurchase(
        address buyer,
        uint256 usdAmount
    ) external onlyAuthorizedProcessor whenNotPaused returns (bytes32) {
        require(buyer != address(0), "Invalid buyer address");
        require(usdAmount >= minPurchaseAmount, "Amount below minimum");
        require(usdAmount <= maxPurchaseAmount, "Amount above maximum");
        
        uint256 vaultAmount = (usdAmount * usdToVaultRate) / 100; // Convert cents to VAULT
        bytes32 transactionId = keccak256(abi.encodePacked(
            buyer,
            usdAmount,
            block.timestamp,
            block.prevrandao
        ));
        
        require(!processedTransactions[transactionId], "Transaction already exists");
        
        purchaseOrders[transactionId] = PurchaseOrder({
            buyer: buyer,
            usdAmount: usdAmount,
            vaultAmount: vaultAmount,
            transactionId: transactionId,
            timestamp: block.timestamp,
            completed: false
        });
        
        emit PurchaseInitiated(transactionId, buyer, usdAmount, vaultAmount, block.timestamp);
        
        return transactionId;
    }
    
    function completePurchase(
        bytes32 transactionId
    ) external onlyAuthorizedProcessor whenNotPaused nonReentrant {
        require(!processedTransactions[transactionId], "Transaction already processed");
        
        PurchaseOrder storage order = purchaseOrders[transactionId];
        require(order.buyer != address(0), "Invalid transaction");
        require(!order.completed, "Order already completed");
        
        processedTransactions[transactionId] = true;
        order.completed = true;
        
        // Mint VAULT tokens to buyer
        vaultCoin.mintFromFiat(order.buyer, order.vaultAmount, transactionId);
        
        // Update user purchase history
        userPurchaseHistory[order.buyer] += order.usdAmount;
        
        emit PurchaseCompleted(transactionId, order.buyer, order.vaultAmount, block.timestamp);
    }
    
    function setExchangeRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than 0");
        usdToVaultRate = _newRate;
        emit ExchangeRateUpdated(_newRate, block.timestamp);
    }
    
    function setPurchaseLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min < _max, "Invalid limits");
        minPurchaseAmount = _min;
        maxPurchaseAmount = _max;
    }
    
    function authorizeProcessor(address processor, bool authorized) external onlyOwner {
        authorizedProcessors[processor] = authorized;
        emit ProcessorAuthorized(processor, authorized);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getPurchaseOrder(bytes32 transactionId) external view returns (PurchaseOrder memory) {
        return purchaseOrders[transactionId];
    }
    
    function calculateVaultAmount(uint256 usdAmount) external view returns (uint256) {
        return (usdAmount * usdToVaultRate) / 100;
    }
}
