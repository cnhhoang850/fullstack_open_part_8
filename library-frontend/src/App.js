import React, { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import BooksRecommend from "./components/BookRecommend";
import { useSubscription, useApolloClient } from "@apollo/client";
import { ALL_BOOKS, BOOK_ADDED } from "./queries";

const App = () => {
  const client = useApolloClient();
  const updateCacheWith = (addedBook) => {
    console.log("updating the cache");
    const includedIn = (set, object) =>
      set.map((p) => p.title).includes(object.title);

    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    console.log(
      dataInStore.allBooks,
      includedIn(dataInStore.allBooks, addedBook)
    );
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      console.log("writing to the cache");
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: [...dataInStore.allBooks, addedBook] },
      });
    }
  };

  const subscription = useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log(subscriptionData);
      const addedBook = subscriptionData.data.bookAdded;
      setError(`${addedBook.title} added`);
      updateCacheWith(addedBook);
    },
  });

  console.log(subscription);

  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [errorMessage, setError] = useState(undefined);

  React.useEffect(() => {
    const tokenCheck = localStorage.getItem("library-user-token");
    setToken(tokenCheck);
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const Notify = ({ errorMessage, setError }) => {
    if (!errorMessage) {
      return null;
    }

    setTimeout(() => {
      setError(null);
    }, 5000);

    return <div style={{ color: "red" }}>{errorMessage}</div>;
  };

  if (!token) {
    return (
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("login")}>login</button>

        <Notify errorMessage={errorMessage} />

        <Authors token={token} show={page === "authors"} setError={setError} />

        <Books show={page === "books"} />

        {page === "login" && (
          <LoginForm setToken={setToken} setError={setError} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("add")}>add book</button>
        <button onClick={() => setPage("recommended")}>recommended</button>
        <button onClick={() => logout()}>logout</button>
      </div>

      <Notify errorMessage={errorMessage} setError={setError} />

      <Authors token={token} show={page === "authors"} setError={setError} />

      <Books show={page === "books"} />

      <NewBook
        show={page === "add"}
        setError={setError}
        updateCacheWith={updateCacheWith}
      />

      <BooksRecommend show={page === "recommended"} />
    </div>
  );
};

export default App;
