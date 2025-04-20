// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BookRental is ReentrancyGuard {
    address public owner;
    uint256 public itemCount;

    constructor() {
        owner = msg.sender;
    }

    struct Book {
        string title;
        uint256 dailyPrice;
        uint256 deposit;
        address owner;
        bool isAvailable;
    }

    struct RentalInfo {
        address renter;
        uint256 rentedAt;
    }

    mapping(uint256 => Book) public books;
    mapping(uint256 => RentalInfo) public rentals;

    event BookListed(uint256 indexed itemId, string title, uint256 price, uint256 deposit);
    event BookRented(uint256 indexed itemId, address indexed renter);
    event BookReturned(uint256 indexed itemId, uint256 refund);

    modifier onlyBookOwner(uint256 _itemId) {
        require(msg.sender == books[_itemId].owner, "Not book owner");
        _;
    }

    modifier onlyRenter(uint256 _itemId) {
        require(msg.sender == rentals[_itemId].renter, "Not renter");
        _;
    }

    function listItem(string memory _title, uint256 _dailyPrice, uint256 _deposit) public {
    require(bytes(_title).length > 0, "Title cannot be empty");
    require(_dailyPrice > 0, "Price must be greater than 0");
    require(_deposit > 0, "Deposit must be greater than 0");

    books[itemCount] = Book({
        title: _title,
        dailyPrice: _dailyPrice,
        deposit: _deposit,
        owner: msg.sender,
        isAvailable: true
    });

    emit BookListed(itemCount, _title, _dailyPrice, _deposit);
    itemCount++;
}


  function rentItem(uint256 _itemId) public payable nonReentrant {
    Book storage book = books[_itemId];
    require(book.isAvailable, "Book is not available");

    uint256 totalCost = book.deposit + book.dailyPrice;
    require(msg.value >= totalCost, "Insufficient ETH for renting the book");

    // Check if contract has enough funds to process the transaction
    require(address(this).balance >= totalCost, "Contract balance is insufficient");

    book.isAvailable = false;
    rentals[_itemId] = RentalInfo({
        renter: msg.sender,
        rentedAt: block.timestamp
    });

    emit BookRented(_itemId, msg.sender);
}



    function returnItem(uint256 _itemId) public nonReentrant onlyRenter(_itemId) {
        Book storage book = books[_itemId];
        RentalInfo storage rent = rentals[_itemId];

        require(!book.isAvailable, "Book is not rented");

        uint256 rentalDuration = (block.timestamp - rent.rentedAt) / 1 days;
        if ((block.timestamp - rent.rentedAt) % 1 days > 0) {
            rentalDuration += 1; // count partial days as full
        }

        uint256 rentalFee = rentalDuration * book.dailyPrice;
        uint256 refund = 0;

        if (book.deposit > rentalFee) {
            refund = book.deposit - rentalFee;
        }

        // Transfer rental fee to book owner
        payable(book.owner).transfer(rentalFee);

        // Refund remaining deposit to renter
        if (refund > 0) {
            payable(rent.renter).transfer(refund);
        }

        book.isAvailable = true;
        delete rentals[_itemId];

        emit BookReturned(_itemId, refund);
    }

    // Add the missing getBookCount function
    function getBookCount() public view returns (uint256) {
        return itemCount;
    }
}