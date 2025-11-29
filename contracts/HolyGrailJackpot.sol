// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HolyGrailJackpot is Ownable {
    IERC20 public token;
    
    uint256 public costPerPlay = 20000 * 10**18; // 20000 Tokens
    uint256 public jackpotPool;
    
    // Payout Multipliers (in basis points, 100 = 1x)
    uint256 public shengMultiplier = 500; // 5.0x
    uint256 public xiaoMultiplier = 50;   // 0.5x
    
    // Game State
    mapping(address => bool) public gamePending;
    
    event GameStarted(address indexed player, uint256 cost);
    event GameResult(address indexed player, uint256 resultType, uint256 payout, uint256 jackpotContribution);
    // resultType: 0 = Sheng (Win), 1 = Xiao (Small Loss), 2 = Yin (Loss/Jackpot)

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    address public signerAddress;
    mapping(address => uint256) public nonces;

    // Step 1: User pays to start the game
    function startGame() external {
        require(!gamePending[msg.sender], "Game already pending");
        require(token.transferFrom(msg.sender, address(this), costPerPlay), "Transfer failed");
        
        gamePending[msg.sender] = true;
        emit GameStarted(msg.sender, costPerPlay);
    }

    // Step 2: User submits the result with a valid signature from the backend
    function submitResult(uint8 resultType, bytes memory signature) external {
        require(gamePending[msg.sender], "No game pending");
        require(resultType <= 2, "Invalid result type");
        
        // Use internal nonce tracking
        uint256 nonce = nonces[msg.sender] + 1;
        
        // Verify Signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, resultType, nonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);
        require(recoveredSigner == signerAddress, "Invalid signature");

        // Update Nonce
        nonces[msg.sender] = nonce;

        uint256 payout = 0;
        uint256 jackpotContribution = 0;

        if (resultType == 0) {
            // Sheng Jiao (Holy Grail) - Win
            payout = (costPerPlay * shengMultiplier) / 100;
        } else if (resultType == 1) {
            // Xiao Jiao (Laughing Grail) - Small Loss
            payout = (costPerPlay * xiaoMultiplier) / 100;
            jackpotContribution = costPerPlay - payout;
        } else {
            // Yin Jiao (Yin Grail) - Loss
            payout = 0;
            jackpotContribution = costPerPlay;
        }

        // Update State
        gamePending[msg.sender] = false;
        
        // Handle Jackpot
        if (jackpotContribution > 0) {
            jackpotPool += jackpotContribution;
        }

        // Payout
        if (payout > 0) {
            uint256 balance = token.balanceOf(address(this));
            if (payout > balance) {
                payout = balance; // Should not happen if well funded, but safety check
            }
            token.transfer(msg.sender, payout);
        }

        emit GameResult(msg.sender, resultType, payout, jackpotContribution);
    }

    // Emergency function to reset stuck state (forfeits the current game cost)
    // Idempotent: No require check, just reset.
    function emergencyReset() external {
        gamePending[msg.sender] = false;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // Debugging function (View only)
    function debugVerify(address user, uint8 resultType, bytes memory signature) external view returns (bool isValid, address recovered, address expectedSigner, uint256 currentNonce, uint256 expectedNonce, bytes32 hash) {
        currentNonce = nonces[user];
        expectedNonce = currentNonce + 1;
        expectedSigner = signerAddress;
        
        bytes32 messageHash = keccak256(abi.encodePacked(user, resultType, expectedNonce));
        hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        recovered = recoverSigner(hash, signature);
        isValid = (recovered == expectedSigner);
    }

    // Admin functions
    function setSigner(address _signer) external onlyOwner {
        signerAddress = _signer;
    }

    // Admin functions
    function setCost(uint256 _cost) external onlyOwner {
        costPerPlay = _cost;
    }

    function setMultipliers(uint256 _sheng, uint256 _xiao) external onlyOwner {
        shengMultiplier = _sheng;
        xiaoMultiplier = _xiao;
    }

    function withdraw(uint256 amount) external onlyOwner {
        token.transfer(msg.sender, amount);
    }
    
    // Sync jackpot pool with actual token balance (useful after direct transfers)
    function syncJackpot() external onlyOwner {
        jackpotPool = token.balanceOf(address(this));
    }

    // To fund the jackpot initially
    function depositJackpot(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        jackpotPool += amount;
    }
}
