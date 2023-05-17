const { ethers } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = 0
async function cancelItem() {
    console.log("Canceling item")
    const nftMarketPlace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNFT")
    const cancelItemTxResponse = await nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
    await cancelItemTxResponse.wait(1)

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000))
    }
    console.log("Item canceled")
}

cancelItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
