import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import initWeb3 from '../web3';

const RentBookForm = ({ bookId, rentalPrice }) => {
  const [loading, setLoading] = useState(false);

  const rentBook = async () => {
    setLoading(true);
    const { web3, contract } = await initWeb3();
    const accounts = await web3.eth.getAccounts();
    await contract.methods.rentItem(bookId).send({ from: accounts[0], value: web3.utils.toWei(rentalPrice, 'ether') });
    setLoading(false);
  };

  return (
    <Button onClick={rentBook} disabled={loading}>
      {loading ? 'Renting...' : 'Rent Book'}
    </Button>
  );
};

export default RentBookForm;
