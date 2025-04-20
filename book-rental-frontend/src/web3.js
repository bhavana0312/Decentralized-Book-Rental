import Web3 from 'web3';
import ContractABI from '../abis/BookRental.json'; // Ensure you import the ABI correctly


const initWeb3 = async () => {
  let web3;
  let contract;
  
  // Check if Web3 is injected (e.g. via MetaMask)
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // New method
// Request account access
    } catch (error) {
      alert('User denied account access');
      console.error('User denied account access', error);
    }
  } else {
    alert('No Web3 provider detected. Please install MetaMask.');
    return {};
  }

  // Check the current network
  const networkId = await web3.eth.net.getId();
  if (networkId !== 1337) {  // If the network is not 1337 (local Ganache network)
    alert("Please connect to the correct network (Expected network ID: 1337, Detected: ${networkId})");
    return {};
  }

  // Initialize the contract using ABI and Address
  const contractAddress = ContractAddress[networkId];
  if (!contractAddress) {
    alert('Contract not deployed on the detected network');
    return {};
  }

  contract = new web3.eth.Contract(ContractABI, contractAddress);
  return { web3, contract };
};

export default initWeb3;