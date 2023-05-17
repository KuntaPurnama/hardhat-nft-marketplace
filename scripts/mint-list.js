const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const PRICE = ethers.utils.parseEther("0.1")
async function mintAndList() {
    const nftMarketPlace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNFT")

    console.log("Minting......")
    const mintResponse = await basicNft.mintNft()
    const mintReceipt = await mintResponse.wait(1)
    const tokenId = mintReceipt.events[0].args.tokenId.toString()
    console.log("token Id", tokenId)

    console.log("Approve NFT Listing")
    const approveResponse = await basicNft.approve(nftMarketPlace.address, tokenId)
    await approveResponse.wait(1)

    console.log("Listing NFT")
    const nftListingResponse = await nftMarketPlace.listItem(
        basicNft.address,
        tokenId.toString(),
        PRICE
    )
    await nftListingResponse.wait(1)

    console.log("Listed....")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
