import React, { useState, useEffect } from "react";
import Web3 from "web3";
import ContractAddress from "./config/contractAddress.json";
import YourContractABI from "./abis/BookRental.json";
import BN from "bn.js";
import './App.css';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractOwner, setContractOwner] = useState(null); // Add contract owner state
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
          loadBlockchainData();
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
      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length === 0) {
          console.warn("No accounts found. Please log in to MetaMask.");
          return;
        }
  
        const currentAccount = accounts[0];
        setAccount(currentAccount);
  
        const networkId = await web3Instance.eth.net.getId();
        const contractAddress = ContractAddress[networkId];
  
        if (!contractAddress) {
          alert("Smart contract not deployed to this network.");
          return;
        }
  
        // Instantiate the contract
        const contractInstance = new web3Instance.eth.Contract(
          YourContractABI.abi,
          contractAddress
        );
        setContract(contractInstance); // Set contract in state
  
        const owner = await contractInstance.methods.owner().call();
        setContractOwner(owner);
  
        if (currentAccount.toLowerCase() === owner.toLowerCase()) {
          console.log("The connected account is the contract owner");
        }
  
        // Fetch active book IDs only if contract is initialized
        if (contractInstance) {
          const activeIds = await contractInstance.methods.getActiveBookIds().call();
          if (Array.isArray(activeIds) && activeIds.length > 0) {
            const booksArray = [];
            for (const id of activeIds) {
              const book = await contractInstance.methods.books(id).call();
              const rental = await contractInstance.methods.rentals(id).call();
              booksArray.push({ ...book, index: Number(id), rental });
            }
            setBooks(booksArray);
          }
        } else {
          console.error("Contract not initialized.");
        }
      } catch (err) {
        console.error("Error loading blockchain data:", err);
        alert("Failed to load blockchain data.");
      }
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

    if (account.toLowerCase() !== contractOwner.toLowerCase()) {
      alert("Only the contract owner can list books.");
      return;
    }


    try {
      
      const dailyPriceInWei = web3.utils.toWei(dailyPrice.toString(), "ether");
      const depositInWei = web3.utils.toWei(deposit.toString(), "ether");

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

  const unlistBook = async (itemId) => {
    if (account.toLowerCase() !== contractOwner.toLowerCase()) {
      alert("Only the contract owner can unlist books.");
      return;
    }

    try {

      await contract.methods.unlistItem(itemId).send({ from: account });

      setBooks((prevBooks) => {
        return prevBooks.filter((book) => book.index !== itemId);
      });
      
      console.log("Book unlisted successfully");
    } catch (error) {
      console.error("Error unlisting the book:", error);
      alert(`Failed to unlist the book: ${error.message}`);
    }
  };

  const rentBook = async (index) => {
    if (contract && account && web3) {
      try {
        const book = books.find((b) => b.index === index);

        const dailyPriceWei = book.dailyPrice;
        const depositWei = book.deposit;
        
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

  const returnBook = async (id) => {
    try {
      const book = books.find((b) => b.index === id);
      const rentalStart = Number(book.rental.rentedAt) * 1000;
      const now = Date.now();
      const elapsedMinutes = Math.floor((now - rentalStart) / 60000);
  
      let message = `You rented "${book.title}" for ${elapsedMinutes} minute(s).`;
  
      let penaltyWei = new BN(0);
  
      if (elapsedMinutes > 5) {
        message += " Return exceeds 5 minutes. Deposit is fully forfeited.";
        penaltyWei = new BN(book.deposit.toString());
      } else if (elapsedMinutes > 1) {
        const penaltyEth = (elapsedMinutes - 1) * parseFloat(web3.utils.fromWei(book.dailyPrice, "ether"));
        penaltyWei = new BN(web3.utils.toWei(penaltyEth.toString(), "ether"));
        message += ` Penalty: ${web3.utils.fromWei(penaltyWei.toString(), 'ether')} ETH deducted from deposit.`;
      }
  
      await contract.methods.returnItem(id).send({ from: account });
  
      alert(`${message} Book returned successfully.`);
      loadBlockchainData();
    } catch (err) {
      console.error("Return Error:", err);
      alert("Failed to return book.");
    }
  };

  const withdrawRefund = async () => {
    try {
      await contract.methods.withdrawRefund().send({ from: account });
      alert("Refund withdrawn successfully!");
      loadBlockchainData();
    } catch (error) {
      console.error("Refund Error:", error);
      alert("Failed to withdraw refund.");
    }
  };
  const [refundAmount, setRefundAmount] = useState("0");

  const checkRefund = async () => {
    if (contract && account) {
      const amount = await contract.methods.pendingRefunds(account).call();
      setRefundAmount(web3.utils.fromWei(amount.toString(), 'ether'));
    }
  };
  

  useEffect(() => {
    if (contract && account) checkRefund();
  }, [contract, account]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
    <span className="emoji"></span> <span className="gradient-text">Decentralized Book Rental</span>
  </h1>

        <div className="wallet-info">
          <span className="wallet-label">Connected Account:</span>
          <span className="wallet-address">{account}</span>
        </div>
      </header>
  
      <main className="app-main">
        {/* Contract Owner Section */}
        {account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase() && (
          <div className="dashboard-grid">
            {/* List a New Book */}
            <div className="glass-card">
              <div className="card-header">
                <h2> List a New Book</h2>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Book Title"
                  className="form-input"
                />
                <input
                  type="number"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(e.target.value)}
                  placeholder="Daily Price (ETH)"
                  className="form-input"
                />
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="Deposit (ETH)"
                  className="form-input"
                />
                <button onClick={listBook} className="btn primary-btn">
                  List Book
                </button>
              </div>
            </div>
        
            {/* All Books Section */}
            <div className="glass-card">
              <div className="card-header">
                <h2> All Books</h2>
              </div>
              <div className="book-list books-scroll-container">
                {books.map((book) => (
                  <div key={book.index} className="book-card">
                    <p><strong>{book.title}</strong></p>
                    <p>Rent: {web3?.utils.fromWei(book.dailyPrice, 'ether')} ETH/day + {web3?.utils.fromWei(book.deposit, 'ether')} ETH deposit</p>
                    <p>Status: {book.isAvailable ? 'Available' : 'Rented'}</p>
                    {book.isAvailable ? (
                      <button onClick={() => unlistBook(book.index)} className="btn danger-btn">
                        Unlist
                      </button>
                    ) : (
                      <p className="disabled-text">Cannot unlist rented book</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Renter Section */}
        {account?.toLowerCase() !== contractOwner?.toLowerCase() && (
          <>
            <div className="dashboard-grid">
              {/* Available Books Section */}
              <div className="glass-card">
                <div className="card-header">
                  <h2> Available Books</h2>
                </div>
                <div className="books-scroll-container">
                  {books.filter((book) => book.isAvailable).length > 0 ? (
                    books
                      .filter((book) => book.isAvailable)
                      .map((book) => (
                        <div key={book.index} className="book-card">
                          <p><strong>{book.title}</strong></p>
                          <p>
                            Rent:
                            {book.dailyPrice ? web3?.utils.fromWei(book.dailyPrice.toString(), 'ether') : 'N/A'} ETH/day + 
                            {book.deposit ? web3?.utils.fromWei(book.deposit.toString(), 'ether') : 'N/A'} ETH deposit
                          </p>
                          <button
                            onClick={() => rentBook(book.index)}
                            className="btn primary-btn small-button"
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

              {/* Rented by You Section */}
              <div className="glass-card">
                <div className="card-header">
                  <h2> Rented by You</h2>
                </div>
                <div className="books-scroll-container">
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
                        <div key={book.index} className="book-card">
                          <p><strong>{book.title}</strong></p>
                          <p>Rented At: {new Date(Number(book.rental.rentedAt) * 1000).toLocaleTimeString()}</p>
                          <p>
                            Elapsed:{" "}
                            {Math.floor((Date.now() - Number(book.rental.rentedAt) * 1000) / 60000)} minute(s)
                          </p>
                          <button
                            onClick={() => returnBook(book.index)}
                            className="btn primary-btn"
                          >
                            Return
                          </button>
                        </div>
                      ))
                  ) : (
                    <p>No books rented by you.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Refund Section Centered */}
            {parseFloat(refundAmount) > 0 && (
              <div className="centered-refund-banner">
                <p> Pending Refund: {refundAmount} ETH</p>
                <button onClick={withdrawRefund} className="btn primary-btn">
                  Withdraw Refund
                </button>
              </div>
            )}
          </>
        )}

      </main>
  
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} BookRental DApp</p>
      </footer>
    </div>
  );
}

export default App;