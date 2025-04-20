module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",     // Ganache is running locally
        port: 8545,            // Default Ganache port
        network_id: "1337",       // Match any network id
      },
    },
  
    compilers: {
      solc: {
        version: "0.8.20",      // Make sure it matches the Solidity version you're using
      },
    },
  
    // Adding these for clearer paths
    contracts_directory: "./contracts",  // Define where your contracts are located
    contracts_build_directory: "./build/contracts",  // Define where the compiled contract artifacts will be placed
  };
  