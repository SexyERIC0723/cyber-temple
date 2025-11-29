const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Funding jackpot with account:", deployer.address);

    // Load artifacts
    const artifactsDir = __dirname + '/../js/artifacts';
    if (!fs.existsSync(artifactsDir + '/MockToken.json') || !fs.existsSync(artifactsDir + '/HolyGrailJackpot.json')) {
        console.error("Artifacts not found. Please deploy contracts first.");
        process.exit(1);
    }

    const mockTokenData = JSON.parse(fs.readFileSync(artifactsDir + '/MockToken.json', 'utf8'));
    const jackpotData = JSON.parse(fs.readFileSync(artifactsDir + '/HolyGrailJackpot.json', 'utf8'));

    const tokenAddress = mockTokenData.address;
    const jackpotAddress = jackpotData.address;

    console.log("Token Address:", tokenAddress);
    console.log("Jackpot Address:", jackpotAddress);

    const token = await hre.ethers.getContractAt("MockToken", tokenAddress);
    const jackpot = await hre.ethers.getContractAt("HolyGrailJackpot", jackpotAddress);

    // Amount to fund: 1,000,000 BEI
    const amount = hre.ethers.parseEther("1000000");

    // 1. Mint tokens to deployer
    console.log("Minting 1,000,000 BEI to deployer...");
    const txMint = await token.mint(deployer.address, amount);
    await txMint.wait();
    console.log("Minted.");

    // 2. Approve Jackpot
    console.log("Approving Jackpot...");
    const txApprove = await token.approve(jackpotAddress, amount);
    await txApprove.wait();
    console.log("Approved.");

    // 3. Deposit
    console.log("Depositing to Jackpot...");
    const txDeposit = await jackpot.depositJackpot(amount);
    await txDeposit.wait();
    console.log("Deposited 1,000,000 BEI to Jackpot.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
