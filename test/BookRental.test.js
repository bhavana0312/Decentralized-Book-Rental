const BookRental = artifacts.require("BookRental");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

contract("BookRental", (accounts) => {
  const owner = accounts[0];
  const renter = accounts[1];
  const anotherRenter = accounts[2];

  let instance;

  beforeEach(async () => {
    instance = await BookRental.new({ from: owner });
  });

  it("allow book listing", async () => {
    await instance.listItem("Web3 Handbook", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    const book = await instance.books(0);
    assert.equal(book.title, "Web3 Handbook");
    assert.equal(book.isAvailable, true);
  });

  it("rent and return a book within 1 minute with full refund", async () => {
    await instance.listItem("Solidity Guide", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await timeTravel(50); // return within 1 minute
    await instance.returnItem(0, { from: renter });

    const refund = await instance.pendingRefunds(renter);
    assert.equal(refund.toString(), web3.utils.toWei("0.05"), "Should get full deposit back");
  });

  it("apply penaltyfee if returned after 1 minutes", async () => {
    await instance.listItem("Blockchain Book", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await timeTravel(130); // ~2 minutes
    await instance.returnItem(0, { from: renter });

    const refund = await instance.pendingRefunds(renter);
    // Penalty = (2 - 1) * dailyPrice = 0.01 ETH
    assert.equal(refund.toString(), web3.utils.toWei("0.04"), "Refund should be 0.04 after penalty");
  });

  it("result in no refund after 5+ minutes", async () => {
    await instance.listItem("Late Return Book", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await timeTravel(6 * 60); // 6 minutes
    await instance.returnItem(0, { from: renter });

    const refund = await instance.pendingRefunds(renter);
    assert.equal(refund.toString(), "0", "Should get no refund after 5+ minutes");
  });

  it("allow withdrawal of refund", async () => {
    await instance.listItem("Withdrawable Book", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await timeTravel(50);
    await instance.returnItem(0, { from: renter });

    const preBalance = await web3.eth.getBalance(renter);
    const tx = await instance.withdrawRefund({ from: renter });
    truffleAssert.eventEmitted(tx, 'RefundIssued');

    const postRefund = await instance.pendingRefunds(renter);
    assert.equal(postRefund.toString(), "0", "Refund should be cleared");
  });

  it("allow owner to unlist an available book", async () => {
    await instance.listItem("Unlistable Book", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });

    const tx = await instance.unlistItem(0, { from: owner });
    truffleAssert.eventEmitted(tx, 'BookUnlisted');

    const activeBooks = await instance.getActiveBookIds();
    assert.equal(activeBooks.length, 0, "Book should be removed from active list");
  });

  it("reject unlisting if book is rented", async () => {
    await instance.listItem("Can't Unlist", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await truffleAssert.reverts(instance.unlistItem(0, { from: owner }), "Book is currently rented");
  });

  it("reject double rental attempts", async () => {
    await instance.listItem("Solidity Guide", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06") });

    await truffleAssert.reverts(
      instance.rentItem(0, { from: anotherRenter, value: web3.utils.toWei("0.06") }),
      "Book is not available"
    );
  });

  it("reject insufficient payments", async () => {
    await instance.listItem("Ethereum Basics", web3.utils.toWei("0.01"), web3.utils.toWei("0.05"), { from: owner });

    await truffleAssert.reverts(
      instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.05") }),
      "Insufficient ETH for renting the book"
    );
  });

  function timeTravel(seconds) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [seconds],
          id: new Date().getTime(),
        },
        (err1) => {
          if (err1) return reject(err1);
          web3.currentProvider.send(
            {
              jsonrpc: "2.0",
              method: "evm_mine",
              params: [],
              id: new Date().getTime(),
            },
            (err2, res) => {
              return err2 ? reject(err2) : resolve(res);
            }
          );
        }
      );
    });
  }
});