import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import initWeb3 from '../web3';

const AddBookForm = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { web3, contract } = await initWeb3();
    const accounts = await web3.eth.getAccounts();
    await contract.methods.listItem(bookTitle, bookAuthor, web3.utils.toWei(rentalPrice, 'ether')).send({ from: accounts[0] });
    setLoading(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Book Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter book title"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Author</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter author name"
          value={bookAuthor}
          onChange={(e) => setBookAuthor(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Rental Price (ETH)</Form.Label>
        <Form.Control
          type="number"
          placeholder="Enter rental price in ETH"
          value={rentalPrice}
          onChange={(e) => setRentalPrice(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Book'}
      </Button>
    </Form>
  );
};

export default AddBookForm;