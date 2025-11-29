
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

import dotenv from 'dotenv';
dotenv.config();

// Admin Wallet (Signer)
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in .env file");
    process.exit(1);
}

// Connect to BSC (Testnet or Mainnet)
const RPC_URL = process.env.RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`Signer Address: ${wallet.address}`);

// Load Contract for Nonce Checking
const artifactsPath = path.join(__dirname, 'js/artifacts/HolyGrailJackpot.json');
if (!fs.existsSync(artifactsPath)) {
    console.error("Artifacts not found. Please deploy contracts first.");
    process.exit(1);
}
const jackpotData = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
const jackpotContract = new ethers.Contract(jackpotData.address, jackpotData.abi, wallet);

// API Endpoint: Sign Result
app.get('/api/sign-result', async (req, res) => {
    try {
        const { userAddress, resultType } = req.query;

        if (!userAddress || resultType === undefined) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        // Get Nonce from Contract (Source of Truth)
        // We need the NEXT nonce (current + 1)
        const currentNonce = await jackpotContract.nonces(userAddress);
        const nonce = Number(currentNonce) + 1;

        console.log(`Signing for ${userAddress}: On-Chain=${currentNonce}, Next=${nonce}`);

        // Create Hash
        // Must match Solidity: keccak256(abi.encodePacked(user, resultType, nonce))
        const hash = ethers.solidityPackedKeccak256(
            ["address", "uint8", "uint256"],
            [userAddress, parseInt(resultType), nonce]
        );

        // Sign Hash
        const signature = await wallet.signMessage(ethers.getBytes(hash));

        console.log(`Signed result for ${userAddress}: Type=${resultType}, Nonce=${nonce}`);

        res.json({
            signature,
            nonce
        });

    } catch (error) {
        console.error("Signing error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Keep-alive to prevent process exit (just in case)
setInterval(() => { }, 1000 * 60 * 60);

// Error Handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
