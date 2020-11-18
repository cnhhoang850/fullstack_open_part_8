import React, { useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { ME, ALL_BOOKS } from "../queries";

const BookFavGenreView = ({ filter }) => {
  const allBooks = useQuery(ALL_BOOKS, { variables: { genre: filter } });
  if (allBooks.loading) {
    return null;
  }

  const books = allBooks.data.allBooks;
  return (
    <div>
      <h2>books</h2>
      <h3>Showing books in {filter}</h3>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BooksRecommend = (props) => {
  const [filter, setFilter] = useState("");
  const userGenre = useQuery(ME);

  if (!props.show || userGenre.loading) {
    return null;
  }

  return (
    <div>
      <p>books in yours favorite genre: {userGenre.data.me.favoriteGenre}</p>
      <BookFavGenreView filter={userGenre.data.me.favoriteGenre} />
    </div>
  );
};

export default BooksRecommend;
