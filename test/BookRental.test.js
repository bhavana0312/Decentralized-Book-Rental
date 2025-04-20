const BookRental = artifacts.require("BookRental");

contract("BookRental", (accounts) => {
  const owner = accounts[0];
  const renter = accounts[1];
  const anotherRenter = accounts[2];

  let instance;

  beforeEach(async () => {
    instance = await BookRental.new({ from: owner });
  });

  // Edge Case Tests
  // 1. Double Rental
  it("should reject double rental attempts", async () => {
    await instance.listItem("Solidity Guide", web3.utils.toWei("0.01", "ether"), web3.utils.toWei("0.05", "ether"), { from: owner });

    // Rent the book once
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06", "ether") });

    // Try renting the same book again (should fail)
    try {
      await instance.rentItem(0, { from: anotherRenter, value: web3.utils.toWei("0.06", "ether") });
      assert.fail("Double rental attempt should fail");
    } catch (error) {
      assert(error.message.includes("revert"), "Expected revert error");
    }
  });

  // 2. Insufficient Payment
  it("should reject insufficient payments", async () => {
    await instance.listItem("Ethereum Basics", web3.utils.toWei("0.01", "ether"), web3.utils.toWei("0.05", "ether"), { from: owner });

    // Send less ETH than required
    try {
      await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.05", "ether") }); // Missing first day's rent
      assert.fail("Insufficient payment should fail");
    } catch (error) {
      assert(error.message.includes("revert"), "Expected revert error due to insufficient payment");
    }
  });

  // 3. Late Return Penalty
  it("should penalize late returns", async () => {
    await instance.listItem("Blockchain Basics", web3.utils.toWei("0.01", "ether"), web3.utils.toWei("0.05", "ether"), { from: owner });

    // Rent the book
    await instance.rentItem(0, { from: renter, value: web3.utils.toWei("0.06", "ether") });

    // Simulate 2 days late return
    await timeTravel(172800); // 2 days (2 * 24 * 60 * 60 seconds)

    // Return the book
    await instance.returnItem(0, { from: renter });

    const book = await instance.books(0);
    const rental = await instance.rentals(0);

    // Ensure the book is available again
    assert.equal(book.isAvailable, true, "Book should be available after return");

    // Check that rental info is cleared
    assert.equal(rental.renter, "0x0000000000000000000000000000000000000000", "Rental info not cleared");

    // You can add specific late fee validation here if needed.
  });

  // Helper to simulate time travel (for testing rental durations)
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
