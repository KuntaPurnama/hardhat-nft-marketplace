const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? VERIFICATION_BLOCK_CONFIRMATIONS
        : network.config.blockConfirmations

    log("--------------------------------------------------------")

    const nftMarketPlace = await deploy("NftMarketplace", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name)) {
        log("verifying.....")
        await verify(nftMarketPlace.address, [])
    }

    console.log("network name", network.name)

    log("--------------------------------------------------------")
}

module.exports.tags = ["all", "nftMarketPlace"]
