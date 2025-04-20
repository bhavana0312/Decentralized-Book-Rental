import React, { useState, useEffect } from "react";
import Web3 from "web3";
import ContractAddress from "./config/contractAddress.json";
import YourContractABI from "./abis/BookRental.json";
import BN from "bn.js";

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookTitle, setBookTitle] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [deposit, setDeposit] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          console.warn("MetaMask is locked or no accounts available");
          return;
        }

        setAccount(accounts[0]);

        if (contract && web3) {
          listBook(contract, accounts[0], web3);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [contract]);

  const loadBlockchainData = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.requestAccounts();
      setAccount(accounts[0]);

      const networkId = await web3Instance.eth.net.getId();
      const contractAddress = ContractAddress[networkId];

      if (!contractAddress) {
        alert("Smart contract not deployed to this network.");
        return;
      }

      const contractInstance = new web3Instance.eth.Contract(
        YourContractABI.abi,
        contractAddress
      );
      setContract(contractInstance);

      const bookCount = await contractInstance.methods.getBookCount().call();
      const booksArray = [];

      for (let i = 0; i < bookCount; i++) {
        const book = await contractInstance.methods.books(i).call();
        const rental = await contractInstance.methods.rentals(i).call();
        booksArray.push({ ...book, index: i, rental });
      }

      setBooks(booksArray);
    } else {
      alert("Please install MetaMask.");
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const listBook = async () => {
    if (!bookTitle || !dailyPrice || !deposit) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const dailyPriceInWei = dailyPrice.toString();
      const depositInWei = deposit.toString();

      await contract.methods
        .listItem(bookTitle, dailyPriceInWei, depositInWei)
        .send({ from: account });

      alert("Book listed successfully.");
      setBookTitle("");
      setDailyPrice("");
      setDeposit("");
      loadBlockchainData();
    } catch (err) {
      console.error("List Error:", err);
      alert("Failed to list book.");
    }
  };

  const rentBook = async (index) => {
    if (contract && account && web3) {
      try {
        const book = books[index];
        const dailyPriceWei = web3.utils.toWei(book.dailyPrice.toString(), "ether");
        const depositWei = web3.utils.toWei(book.deposit.toString(), "ether");

        const total = new BN(dailyPriceWei).add(new BN(depositWei));

        await contract.methods.rentItem(index).send({
          from: account,
          value: total.toString(),
        });

        alert("Book rented successfully.");
        await loadBlockchainData();
      } catch (error) {
        console.error("Error renting book:", error);
        alert("Failed to rent book.");
      }
    }
  };

  const returnBook = async (index) => {
    try {
      await contract.methods.returnItem(index).send({ from: account });
      alert("Book returned successfully.");
      loadBlockchainData();
    } catch (err) {
      console.error("Return Error:", err);
      alert("Failed to return book.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>📚 Decentralized Book Rental</h1>
      <p style={{ textAlign: "center" }}>
        <strong>Connected Account:</strong> {account}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "30px",
          gap: "20px",
        }}
      >
        {/* Column 1: List a Book */}
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h2 style={{ marginBottom: "30px" }}>📝 List a New Book</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Book Title"
              style={{
                height: "45px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                padding: "0 10px",
                fontSize: "16px",
              }}
            />
            <input
              type="number"
              value={dailyPrice}
              onChange={(e) => setDailyPrice(e.target.value)}
              placeholder="Daily Price (ETH)"
              style={{
                height: "45px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                padding: "0 10px",
                fontSize: "16px",
              }}
            />
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="Deposit (ETH)"
              style={{
                height: "45px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                padding: "0 10px",
                fontSize: "16px",
              }}
            />
            <button
              onClick={listBook}
              style={{
                height: "45px",
                borderRadius: "10px",
                backgroundColor: "rgba(61, 158, 243, 0.795)",
                color: "white",
                border: "none",
                fontSize: "16px",
              }}
            >
              List Book
            </button>
          </div>
        </div>

        {/* Column 2: Available Books */}
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            height: "450px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ marginBottom: "30px" }}>📖 Available Books</h2>
          <div style={{ overflowY: "auto", flexGrow: 1 }}>
            {books.filter((book) => book.isAvailable).length > 0 ? (
              books
                .filter((book) => book.isAvailable)
                .map((book) => (
                  <div
                    key={book.index}
                    style={{
                      marginBottom: "15px",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "10px",
                    }}
                  >
                    <p>
                      <strong>{book.title}</strong>
                    </p>
                    <p>
                      Rent: {book.dailyPrice} ETH/day + {book.deposit} ETH deposit
                    </p>

                    <button
                      onClick={() => rentBook(book.index)}
                      style={{
                        padding: " 2px 6px",
                        fontSize: "16px",
                      }}
                    >
                      Rent
                    </button>
                  </div>
                ))
            ) : (
              <p>No available books.</p>
            )}
          </div>
        </div>

        {/* Column 3: Rented by You */}
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            height: "450px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ marginBottom: "30px" }}>📦 Rented by You</h2>
          <div style={{ overflowY: "auto", flexGrow: 1 }}>
            {books.filter(
              (book) =>
                !book.isAvailable &&
                book.rental.renter.toLowerCase() === account?.toLowerCase()
            ).length > 0 ? (
              books
                .filter(
                  (book) =>
                    !book.isAvailable &&
                    book.rental.renter.toLowerCase() === account?.toLowerCase()
                )
                .map((book) => (
                  <div
                    key={book.index}
                    style={{
                      marginBottom: "15px",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "10px",
                    }}
                  >
                    <p>
                      <strong>{book.title}</strong>
                    </p>
                    <button
                      onClick={() => returnBook(book.index)}
                      style={{
                        padding: " 2px 6px",
                        fontSize: "16px",
                      }}
                    >
                      Return
                    </button>
                  </div>
                ))
            ) : (
              <p>You haven't rented any books.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;