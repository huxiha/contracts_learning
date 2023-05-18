// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarket__PriceMustAboveZero();
error NftMarket__NotApprovedForMarket();
error NftMarket__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarket__NotOwner();
error NftMarket__NotListed(address nftAddress, uint256 tokenId);
error NftMarket__PriceNotMeet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarket__NotProceeds();
error NftMarket__TransferFailed();

contract NftMarket is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }
    mapping(address => mapping(uint256 => Listing)) private s_nftListing;
    mapping(address => uint256) private s_proceeds;

    event ItemListed(
        address indexed sender,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed spender,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId
    );

    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory list = s_nftListing[nftAddress][tokenId];
        if (list.price > 0) {
            revert NftMarket__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address nftOwner = nft.ownerOf(tokenId);
        if (nftOwner != spender) {
            revert NftMarket__NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory list = s_nftListing[nftAddress][tokenId];
        if (list.price == 0) {
            revert NftMarket__NotListed(nftAddress, tokenId);
        }
        _;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarket__PriceMustAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarket__NotApprovedForMarket();
        }
        s_nftListing[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        Listing memory wantBuiedNftList = s_nftListing[nftAddress][tokenId];
        if (msg.value < wantBuiedNftList.price) {
            revert NftMarket__PriceNotMeet(
                nftAddress,
                tokenId,
                wantBuiedNftList.price
            );
        }
        s_proceeds[wantBuiedNftList.seller] += msg.value;
        delete (s_nftListing[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(
            wantBuiedNftList.seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(
            msg.sender,
            nftAddress,
            tokenId,
            wantBuiedNftList.price
        );
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_nftListing[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        if (newPrice <= 0) {
            revert NftMarket__PriceMustAboveZero();
        }
        s_nftListing[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarket__NotProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarket__TransferFailed();
        }
    }

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_nftListing[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
