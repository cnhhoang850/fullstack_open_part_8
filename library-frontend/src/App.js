import React, { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import BooksRecommend from "./components/BookRecommend";
import { useApolloClient } from "@apollo/client";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [errorMessage, setError] = useState(undefined);
  const client = useApolloClient();

  React.useEffect(() => {
    const tokenCheck = localStorage.getItem("library-user-token");
    setToken(tokenCheck);
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const Notify = ({ errorMessage }) => {
    if (!errorMessage) {
      return null;
    }

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

      <Authors token={token} show={page === "authors"} setError={setError} />

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      <BooksRecommend show={page === "recommended"} />
    </div>
  );
};

export default App;
