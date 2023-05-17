const { ethers } = require("hardhat")
const fs = require("fs")
const {
    frontEndContractsFile,
    frontEndContractsFile2,
    frontEndAbiLocation,
    frontEndAbiLocation2,
} = require("../helper-hardhat-config")

const FRONT_END_ADDRESSES_FILE =
    "../nextjs-moralis-nft-marketplace/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-moralis-nft-marketplace/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("update front end")
        await updateContractAddress()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    // fs.writeFileSync(
    //     `${frontEndAbiLocation2}NftMarketplace.json`,
    //     nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    // )

    const basicNft = await ethers.getContract("BasicNFT")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
    // fs.writeFileSync(
    //     `${frontEndAbiLocation2}BasicNft.json`,
    //     basicNft.interface.format(ethers.utils.FormatTypes.json)
    // )
}

async function updateContractAddress() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddress = nftMarketplace.address
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId]["NftMarketplace"].includes(contractAddress)) {
            currentAddresses[chainId]["NftMarketplace"].push(contractAddress)
        }
    } else {
        currentAddresses[chainId] = { NftMarketplace: contractAddress }
    }

    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}
module.exports.tags = ["all", "frontend"]
