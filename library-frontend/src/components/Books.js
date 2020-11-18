import React, { useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { ALL_BOOKS } from "../queries";

const Books = (props) => {
  const [filter, setFilter] = useState("all");
  const result = useQuery(ALL_BOOKS, { variables: { genre: filter } });
  const staticAllBooks = useQuery(ALL_BOOKS);
  if (!props.show || result.loading) {
    return null;
  }

  const books = result.data.allBooks;
  const allGenresFlat = staticAllBooks.data.allBooks
    .map((book) => book.genres)
    .flat();
  const allGenresOptions = ["all", ...new Set(allGenresFlat)];
  const changeFilter = (filter) => {
    setFilter(filter);
    staticAllBooks.refetch();
    result.refetch();
  };
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
      {allGenresOptions.map((genre) => (
        <button onClick={() => changeFilter(genre)}>{genre}</button>
      ))}
    </div>
  );
};

export default Books;
