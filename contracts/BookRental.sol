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

    // Active books tracking
    uint[] public activeBookIds;
    mapping(uint => uint) public bookIdToActiveIndex;

    event BookListed(uint256 indexed itemId, string title, uint256 price, uint256 deposit);
    event BookRented(uint256 indexed itemId, address indexed renter);
    event BookReturned(uint256 indexed itemId, uint256 refund);
    event BookUnlisted(uint256 indexed itemId, string title);
    event RefundIssued(uint256 indexed itemId, address renter, uint256 refundAmount);

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

        activeBookIds.push(itemCount);
        bookIdToActiveIndex[itemCount] = activeBookIds.length - 1;

        emit BookListed(itemCount, _title, _dailyPrice, _deposit);
        itemCount++;
    }

    function rentItem(uint256 _itemId) public payable nonReentrant {
        Book storage book = books[_itemId];
        require(book.isAvailable, "Book is not available");

        uint256 totalCost = book.deposit + book.dailyPrice;
        require(msg.value >= totalCost, "Insufficient ETH for renting the book");
        require(address(this).balance >= totalCost, "Contract balance is insufficient");

        book.isAvailable = false;
        rentals[_itemId] = RentalInfo({
            renter: msg.sender,
            rentedAt: block.timestamp
        });

        emit BookRented(_itemId, msg.sender);
    }

    mapping(address => uint256) public pendingRefunds;

    function returnItem(uint256 _itemId) public nonReentrant onlyRenter(_itemId) {
        Book storage book = books[_itemId];
        RentalInfo storage rent = rentals[_itemId];

        require(!book.isAvailable, "Book is not rented");

        uint256 timePassed = block.timestamp - rent.rentedAt;
        uint256 secondsElapsed = timePassed;

        uint256 penalty = 0;
        uint256 refund = 0;
        uint256 rentalFee = book.dailyPrice;

        if (secondsElapsed <= 60) {
            refund = book.deposit;
        } else if (secondsElapsed <= 5 * 60) {
            penalty = (secondsElapsed / 60 - 1) * book.dailyPrice;
            refund = book.deposit > penalty ? book.deposit - penalty : 0;
        } else {
            refund = 0;
        }

        payable(book.owner).transfer(rentalFee);

        if (refund > 0) {
            pendingRefunds[msg.sender] += refund;
        }

        book.isAvailable = true;
        delete rentals[_itemId];

        emit BookReturned(_itemId, refund);
    }

    function unlistItem(uint256 _itemId) public onlyBookOwner(_itemId) {
        Book storage book = books[_itemId];
        require(book.isAvailable, "Book is currently rented and cannot be unlisted");

        book.isAvailable = false;

        uint indexToRemove = bookIdToActiveIndex[_itemId];
        uint lastId = activeBookIds[activeBookIds.length - 1];

        activeBookIds[indexToRemove] = lastId;
        bookIdToActiveIndex[lastId] = indexToRemove;

        activeBookIds.pop();
        delete bookIdToActiveIndex[_itemId];

        emit BookUnlisted(_itemId, book.title);

        delete books[_itemId];
    }

    function withdrawRefund() public nonReentrant {
        uint256 refundAmount = pendingRefunds[msg.sender];
        require(refundAmount > 0, "No refund available");

        pendingRefunds[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(0, msg.sender, refundAmount);
    }

    function getActiveBookIds() public view returns (uint[] memory) {
        return activeBookIds;
    }
}