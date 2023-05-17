const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

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

    log("---------------------------------------")
}

module.exports.tags = ["all", "basicNft"]
