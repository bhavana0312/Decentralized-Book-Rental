import React, { useState, useEffect } from 'react';
import { Button, Table } from 'react-bootstrap';
import initWeb3 from '../web3';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const { contract } = await initWeb3();
      const availableBooks = await contract.methods.getAvailableBooks().call();
      setBooks(availableBooks);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Rental Price (ETH)</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, index) => (
          <tr key={index}>
            <td>{book.bookTitle}</td>
            <td>{book.bookAuthor}</td>
            <td>{web3.utils.fromWei(book.rentalPrice, 'ether')}</td>
            <td>
              <Button variant="primary">Rent</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default BookList;