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
    const basicNFT = await ethers.getContract("BasicNFT")
    const chainId = network.config.chainId.toString()
    const contractAddress = nftMarketplace.address
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    const contractAddressBasicNFT = basicNFT.address
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId]["NftMarketplace"].includes(contractAddress)) {
            currentAddresses[chainId]["NftMarketplace"].push(contractAddress)
        }

        if (!currentAddresses[chainId]["BasicNFT"].includes(contractAddressBasicNFT)) {
            currentAddresses[chainId]["BasicNFT"].push(contractAddressBasicNFT)
        }
    } else {
        currentAddresses[chainId] = {
            BasicNFT: contractAddressBasicNFT,
            NftMarketplace: contractAddress,
        }
    }
    console.log("json ", currentAddresses)
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}
module.exports.tags = ["all", "frontend"]
