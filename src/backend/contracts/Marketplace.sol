//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {
    address payable public immutable feeAccount; // The account that receives fees
    uint256 public immutable feePercent; // The fee percentage on sales
    uint256 public itemCount;
    struct Item {
        uint256 itemID;
        IERC721 nft;
        uint256 tokenID;
        uint256 price;
        address payable seller;
        bool sold;
    }

    event ItemCreated(
        uint256 itemID,
        address indexed nft,
        uint256 tokenID,
        uint256 price,
        address indexed seller
    );

    event ItemSold(
        uint256 itemID,
        address indexed nft,
        uint256 tokenID,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );
    // itemID -> Item
    mapping(uint256 => Item) public idToItem;

    constructor(uint256 _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    function createItem(
        IERC721 _nft,
        uint256 _tokenID,
        uint256 _price
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than 0");
        itemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenID);
        idToItem[itemCount] = Item(
            itemCount,
            _nft,
            _tokenID,
            _price,
            payable(msg.sender),
            false
        );

        emit ItemCreated(
            itemCount,
            address(_nft),
            _tokenID,
            _price,
            msg.sender
        );
    }

    function purchaseItem(uint256 _itemID) external payable nonReentrant {
        uint256 _totalPrice = getTotalPrice(_itemID);
        Item storage item = idToItem[_itemID];
        require(_itemID > 0 && _itemID <= itemCount, "Item does not exist");
        require(
            msg.value >= _totalPrice,
            "Not enough ether to cover item price and market fee"
        );
        require(!item.sold, "Item already sold");

        // Pay seller and fee account
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);

        // Update item to sold
        item.sold = true;

        // Transfer NFT to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenID);

        // Emit Bought event
        emit ItemSold(
            _itemID,
            address(item.nft),
            item.tokenID,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function getTotalPrice(uint256 _itemID) public view returns (uint256) {
        return ((idToItem[_itemID].price * (100 + feePercent)) / 100);
    }
}
