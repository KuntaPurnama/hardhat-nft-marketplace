const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? VERIFICATION_BLOCK_CONFIRMATIONS
        : network.config.blockConfirmations

    log("---------------------------------------")

    const basicNft = await deploy("BasicNFT", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name)) {
        log("Verifying......")
        await verify(basicNft.address, [])
    }

    console.log("chain id", network.config.chainId)
    console.log("network name", network.name)
    // console.log("token URI", basicNft)
    // const tokenURI = await basicNft.tokenURI(0)
    // console.log("token URI", tokenURI)

    log("---------------------------------------")
}

module.exports.tags = ["all", "basicNft"]
