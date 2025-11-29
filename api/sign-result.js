// Vercel Serverless Function for signing game results
import { ethers } from 'ethers';

// Load contract artifacts
import jackpotArtifact from '../js/artifacts/HolyGrailJackpot.json' assert { type: 'json' };

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userAddress, resultType } = req.query;

        if (!userAddress || resultType === undefined) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Get environment variables
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const RPC_URL = process.env.RPC_URL || 'https://bsc-dataseed.binance.org/';

        if (!PRIVATE_KEY) {
            console.error('PRIVATE_KEY not configured in Vercel environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Connect to BSC
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        // Get contract instance
        const jackpotContract = new ethers.Contract(
            jackpotArtifact.address,
            jackpotArtifact.abi,
            wallet
        );

        // Get Nonce from Contract (Source of Truth)
        const currentNonce = await jackpotContract.nonces(userAddress);
        const nonce = Number(currentNonce) + 1;

        console.log(`Signing for ${userAddress}: On-Chain=${currentNonce}, Next=${nonce}`);

        // Create message hash
        const messageHash = ethers.solidityPackedKeccak256(
            ['address', 'uint8', 'uint256'],
            [userAddress, resultType, nonce]
        );

        // Sign (EIP-191)
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));

        return res.status(200).json({
            signature,
            nonce,
            signer: wallet.address
        });

    } catch (error) {
        console.error('Error in sign-result:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
