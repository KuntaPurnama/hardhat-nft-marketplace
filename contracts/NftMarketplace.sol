// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error AlreadyListed(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error PriceMustBeAboveZero();
error NotApprovedForMarketPlace();
error NotOwner();
error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NoProceeds();
error IsOwner();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    mapping(address => mapping(uint256 => Listing)) s_listing;
    mapping(address => uint256) private s_proceeds;

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address sender
    ) {
        IERC721 nft = IERC721(nftAddress);
        if (nft.ownerOf(tokenId) != sender) {
            revert NotOwner();
        }

        _;
    }

    modifier isNotOwner(
        address nftAddress,
        uint256 tokenId,
        address sender
    ) {
        IERC721 nft = IERC721(nftAddress);
        if (nft.ownerOf(tokenId) == sender) {
            revert IsOwner();
        }

        _;
    }

    /*
     * @notice Method for listing NFT
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param price sale price for each item
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }

        Listing memory item = Listing(price, msg.sender);

        //We need to check if this contract has approval from the NFT owner to put their NFT in our listing
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketPlace();
        }
        s_listing[nftAddress][tokenId] = item;
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /*
     * @notice Method for buying listing
     * @notice The owner of an NFT could unapprove the marketplace,
     * which would cause this function to fail
     * Ideally you'd also have a `createOffer` functionality.
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     */
    function buyItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        payable
        isListed(nftAddress, tokenId)
        isNotOwner(nftAddress, tokenId, msg.sender)
        nonReentrant
    {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (msg.value < listing.price) {
            revert PriceNotMet(nftAddress, tokenId, msg.value);
        }
        s_proceeds[listing.seller] += msg.value;
        delete (s_listing[nftAddress][tokenId]);

        // Could just send the money...
        // https://fravoll.github.io/solidity-patterns/pull_over_push.html
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, msg.value);
    }

    /*
     * @notice Method for updating listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param newPrice Price in Wei of the item
     */

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) nonReentrant isOwner(nftAddress, tokenId, msg.sender) {
        if (newPrice <= 0) {
            revert PriceMustBeAboveZero();
        }

        s_listing[nftAddress][tokenId].price = newPrice;

        //or u can do more explicit like this way
        // Listing memory listedItem = s_listing[nftAddress][tokenId];
        // listedItem.price = newPrice;
        // s_listing[nftAddress][tokenId] = listedItem;

        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    /*
     * @notice Method for cancelling listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     */
    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isListed(nftAddress, tokenId) nonReentrant isOwner(nftAddress, tokenId, msg.sender) {
        delete (s_listing[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /*
     * @notice Method for withdrawing proceeds from sales
     */
    function withdrawProceeds() external nonReentrant {
        uint256 balance = s_proceeds[msg.sender];
        if (balance <= 0) {
            revert NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: balance}("");

        require(success, "Transfer failed");
    }

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listing[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
