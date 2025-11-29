const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy Mock Token
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const token = await MockToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("MockToken deployed to:", tokenAddress);

    // 2. Deploy Jackpot Contract
    const HolyGrailJackpot = await hre.ethers.getContractFactory("HolyGrailJackpot");
    const jackpot = await HolyGrailJackpot.deploy(tokenAddress);
    await jackpot.waitForDeployment();
    const jackpotAddress = await jackpot.getAddress();
    console.log("HolyGrailJackpot deployed to:", jackpotAddress);

    // 3. Fund the Jackpot (Optional, for testing)
    // Mint some tokens to deployer first (already done in constructor)
    // Approve jackpot to spend deployer's tokens
    const amount = hre.ethers.parseEther("10000");
    await token.approve(jackpotAddress, amount);
    await jackpot.depositJackpot(amount);
    console.log("Funded Jackpot with:", hre.ethers.formatEther(amount), "BEI");

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
