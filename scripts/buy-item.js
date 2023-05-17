const { ethers } = require("hardhat")

const TOKEN_ID = 0
async function buy() {
    console.log("Start Buy Item")
    const nftMarketPlace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNFT")
    const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
    const price = listing.price.toString()
    const buyResponse = await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: price })
    await buyResponse.wait(1)

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000))
    }
    console.log("Item Bought")
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
