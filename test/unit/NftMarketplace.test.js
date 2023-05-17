const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect, use } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace Unit Test", function () {
          let deployer, nftMarketPlace, nftMarketPlaceContract, basicNft
          const price = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              nftMarketPlaceContract = await ethers.getContract("NftMarketplace")
              nftMarketPlace = nftMarketPlaceContract.connect(deployer)
              basicNft = await ethers.getContract("BasicNFT", deployer.address)
              await basicNft.mintNft()
          })

          describe("listItem", function () {
              it("listItem NFT price less or equals to zero", async function () {
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("PriceMustBeAboveZero")
              })

              it("listItem NFT not Owner", async function () {
                  const accounts = await ethers.getSigners()
                  const nftMarketPlaceSecondAccount = await ethers.getContract(
                      "NftMarketplace",
                      accounts[1].address
                  )

                  await expect(
                      nftMarketPlaceSecondAccount.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.be.revertedWith("NotOwner")
              })

              it("listItem NFT haven't approved", async function () {
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.be.revertedWith("NotApprovedForMarketPlace")
              })

              it("listItem NFT already listed", async function () {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.be.revertedWith("AlreadyListed")
              })

              it("listItem NFT success", async function () {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.be.emit(nftMarketPlace, "ItemListed")

                  const nft = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(price.toString(), nft.price.toString())
                  assert.equal(deployer.address, nft.seller)
              })
          })

          describe("buyItem", function () {
              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
              })

              it("buyItem notListed", async () => {
                  await expect(nftMarketPlace.buyItem(basicNft.address, 1)).to.be.revertedWith(
                      "NotListed"
                  )
              })

              it("buyItem isOwner", async () => {
                  await expect(
                      nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("IsOwner")
              })

              it("buyItem priceNotMeet", async () => {
                  const priceToBuy = ethers.utils.parseEther("0.001")
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  const nftMarketPlace = await nftMarketPlaceContract.connect(user)
                  await expect(
                      nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: priceToBuy })
                  ).to.be.revertedWith("PriceNotMet")
              })

              it("buyItem success", async () => {
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  nftMarketPlace = await nftMarketPlaceContract.connect(user)
                  await expect(
                      nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, {
                          value: price,
                      })
                  ).to.be.emit(nftMarketPlace, "ItemBought")

                  const proceeds = await nftMarketPlace.getProceeds(deployer.address)
                  assert.equal(proceeds.toString(), price.toString())

                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), "0")

                  const currentOwner = await basicNft.ownerOf(TOKEN_ID)
                  assert.equal(user.address, currentOwner)
              })
          })

          describe("updateListing", function () {
              const newPrice = ethers.utils.parseEther("1")

              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
              })

              it("updateListing isListed", async () => {
                  await expect(
                      nftMarketPlace.updateListing(basicNft.address, 1, newPrice)
                  ).to.be.revertedWith("NotListed")
              })

              it("updateListing notOwner", async () => {
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  nftMarketPlace = nftMarketPlaceContract.connect(user)

                  await expect(
                      nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.be.revertedWith("NotOwner")
              })

              it("updateListing priceMustAboveZero", async () => {
                  await expect(
                      nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("PriceMustBeAboveZero")
              })

              it("updateListing success", async () => {
                  await expect(
                      nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.be.emit(nftMarketPlace, "ItemListed")

                  const nft = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(nft.price.toString(), newPrice.toString())
              })
          })

          describe("cancelListing", function () {
              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
              })

              it("cancelListing isListed", async () => {
                  await expect(
                      nftMarketPlace.cancelListing(basicNft.address, 1)
                  ).to.be.revertedWith("NotListed")
              })

              it("cancelListing notOwner", async () => {
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  nftMarketPlace = nftMarketPlaceContract.connect(user)

                  await expect(
                      nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotOwner")
              })

              it("cancelListing success", async () => {
                  await expect(nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)).to.be.emit(
                      nftMarketPlace,
                      "ItemCanceled"
                  )

                  const nft = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(nft.price.toString(), "0")
              })
          })

          describe("withdraw", function () {
              beforeEach(async () => {
                  await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, price)
              })

              it("withdraw NoProceeds", async () => {
                  await expect(nftMarketPlace.withdrawProceeds()).to.be.revertedWith("NoProceeds")
              })

              it("withdraw success", async () => {
                  const accounts = await ethers.getSigners()
                  const user = accounts[1]
                  nftMarketPlace = nftMarketPlaceContract.connect(user)

                  const prevDeployerBalance = await nftMarketPlace.provider.getBalance(
                      deployer.address
                  )
                  await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: price })

                  nftMarketPlace = nftMarketPlace.connect(deployer)

                  const txResponse = await nftMarketPlace.withdrawProceeds()
                  const txReceipt = await txResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), "0")

                  const currentOwner = await basicNft.ownerOf(TOKEN_ID)
                  assert.equal(user.address, currentOwner)

                  const currentDeployerBalance = await nftMarketPlace.provider.getBalance(
                      deployer.address
                  )

                  assert.equal(
                      prevDeployerBalance.add(price).toString(),
                      currentDeployerBalance.add(gasCost).toString()
                  )
              })
          })
      })
