const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    if (!deployer) {
        console.error("Error: No deployer account found. Check your .env file and PRIVATE_KEY.");
        process.exit(1);
    }
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy Mock Token (or use existing)
    let tokenAddress;
    let token;

    if (process.env.TOKEN_ADDRESS) {
        tokenAddress = process.env.TOKEN_ADDRESS;
        console.log("Using existing token at:", tokenAddress);
        token = await hre.ethers.getContractAt("IERC20", tokenAddress); // Use Interface
    } else {
        const MockToken = await hre.ethers.getContractFactory("MockToken");
        token = await MockToken.deploy();
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
        console.log("MockToken deployed to:", tokenAddress);
    }

    // 2. Deploy Jackpot Contract
    const HolyGrailJackpot = await hre.ethers.getContractFactory("HolyGrailJackpot");
    const jackpot = await HolyGrailJackpot.deploy(tokenAddress);
    await jackpot.waitForDeployment();
    const jackpotAddress = await jackpot.getAddress();
    console.log("HolyGrailJackpot deployed to:", jackpotAddress);

    // Set Signer (Default Hardhat Account #0)
    await jackpot.setSigner(deployer.address);
    console.log("Signer set to:", deployer.address);

    // 3. Fund the Jackpot (Optional, for testing)
    if (!process.env.TOKEN_ADDRESS) {
        // Mint some tokens to deployer first (already done in constructor)
        // Approve jackpot to spend deployer's tokens
        const amount = hre.ethers.parseEther("10000");
        const txApprove = await token.approve(jackpotAddress, amount);
        await txApprove.wait(); // Wait for confirmation
        const txDeposit = await jackpot.depositJackpot(amount);
        await txDeposit.wait();
        console.log("Funded Jackpot with:", hre.ethers.formatEther(amount), "BEI");
    } else {
        console.log("Skipping auto-funding for existing token. Please fund manually.");
    }

    // 4. Save ABI and Address for Frontend
    const artifactsDir = path.join(__dirname, "../js/artifacts");
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const tokenArtifact = await hre.artifacts.readArtifact("MockToken");
    const jackpotArtifact = await hre.artifacts.readArtifact("HolyGrailJackpot");

    fs.writeFileSync(
        path.join(artifactsDir, "MockToken.json"),
        JSON.stringify({ address: tokenAddress, abi: tokenArtifact.abi }, null, 2)
    );
    fs.writeFileSync(
        path.join(artifactsDir, "HolyGrailJackpot.json"),
        JSON.stringify({ address: jackpotAddress, abi: jackpotArtifact.abi }, null, 2)
    );

    console.log("Artifacts saved to js/artifacts/");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
