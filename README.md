# Cryptohives

#  Decentralized Book Rental Platform

A decentralized application (DApp) that allows owners to list books for rent and renters to rent and return books securely through the blockchain.

Built using *Solidity, **React.js, **Web3.js, and **Ganache*.

---

## Team
Team-name: Cryptohives<br>
Vangapally PranavaReddy - mc230041037,<br>
Annamareddi Suhitha - cse230001008,<br>
Polathala Bhavana - mc230041026,<br>
Kommireddy Jayanthi - cse230001041,<br>
Akella Akhila - cse230001005,<br>
Parimi Sunitha - cse230001061.


##  Features

- *Owners:* Only owners can list books for rent.
- *Renters:* Renters can view and rent available books.
- *Listing, Renting, Returning, Unlisting:* Full lifecycle support for book rentals.
- *Refunds:* Renters can withdraw refunds after returning books.
- *Penalty Calculation:* Penalty for late return is auto-calculated.
- *MetaMask Integration:* All blockchain transactions handled via MetaMask prompts.
- *Local Blockchain:* Powered by Ganache for development and testing.

---
## Interpretations
This decentralized book rental application demonstrates the power of blockchain in managing peer-to-peer rentals without relying on centralized intermediaries.
It showcases secure user role management (owners and renters), transparent transactions using smart contracts, automatic penalty handling for late returns, and refund settlements — all directly controlled by users through their own wallets.
The project emphasizes real-world usage of Ethereum, smart contracts, and decentralized authentication in a simple rental marketplace setting.

---
##  Tech Stack

- *Frontend:* React.js, Web3.js
- *Smart Contract:* Solidity
- *Blockchain Network:* Ganache (local Ethereum blockchain)
- *Wallet:* MetaMask

---
##  Getting Started

### 1. Prerequisites

- Node.js and npm installed
- Truffle installed (npm install -g truffle)
- Ganache installed and running
- MetaMask extension installed on browser

---

### 2. Clone the Repository

```bash
git clone https://github.com/bhavana0312/Cryptohives/tree/master
cd /current_project_directory/
```


---

### 3. Install Dependencies

```bash
npm install
```


---

### 4. Compile and Deploy the Smart Contract

Make sure Ganache is running locally (default: http://127.0.0.1:8545).
```bash
ganache --chain.chainId 1337 --server.port 8545 --chain.networkId 1337
```


```bash
truffle compile
truffle migrate --network development --reset
```
After migrating the smart contact, make sure the contact address in the code(BookRental.json and contractAddress.json) is correctly updated.

---

### 5. Configure Web3 in Frontend

In src/web3.js, ensure the provider is correctly set to your Ganache network.

---

### 6. Start the Frontend

```bash
cd book-rental-frontend
npm start
```

The app will be available at: [http://localhost:3000](http://localhost:3000)

---

### 7. Connect MetaMask

- Set MetaMask network to *Localhost 8545* (or Ganache's network).
- Import Ganache accounts into MetaMask using private keys shown in Ganache.

---

##  Login Instructions

- When you run Ganache, it will create *10 accounts*.
- *The first account* (Account 0) connected in MetaMask will automatically become the *Owner*.
- *Any other account* (Account 1-9) connected in MetaMask will act as a *Renter*.
- You must select the correct account in MetaMask before interacting with the app.

---

##  Usage Workflow

###  Listing a Book (Owner)

- Owner fills in book details (title, daily price, deposit, etc.).
- Submitting the form triggers a *MetaMask transaction*.
- If the transaction succeeds, the book will appear in the listed books section.

###  Renting a Book (Renter)

- Renter clicks the *Rent* button on an available book.
- A MetaMask transaction will open requesting the *(daily price + deposit)*.
- On successful transaction, the book will be rented to the renter.

###  Unlisting a Book (Owner)

- Owner can *Unlist* a book by clicking the *Unlist* button.
- *Note:* The Unlist button appears *only if the book is NOT currently rented*.
- Submitting unlist triggers a MetaMask transaction to remove the book.

###  Returning a Book (Renter)

- Renter clicks the *Return* button.
- The smart contract calculates *penalty* based on the time elapsed.
- Remaining refund amount (deposit - penalty) will be shown (here considering 1 day as 1minute for demonstartion) .
- The book will be marked as returned.

###  Withdrawing Refund (Renter)

- After returning a book, the renter must click the *Withdraw* button.
- A MetaMask transaction will be initiated to withdraw the remaining refundable amount.


---

## Testing

Make sure Ganache is running locally (default: http://127.0.0.1:8545).
```bash
ganache --chain.chainId 1337 --server.port 8545 --chain.networkId 1337
```
and then in another prompt window run
```bash
truffle test
```

---

##  Security Notes

- Smart contracts implement role-based access control (only owners can list/unlist books).
- Reentrancy protection can be added using OpenZeppelin's ReentrancyGuard.
- This project is developed for local testing; additional security is required for production deployment.

---


##  Acknowledgements

- OpenZeppelin for reusable Solidity libraries
- Ganache and MetaMask for blockchain development and testing
- Truffle Suite for smart contract development framework
