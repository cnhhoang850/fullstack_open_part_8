import React, { useState } from "react";
import { useLazyQuery, useQuery, useMutation } from "@apollo/client";
import { ALL_AUTHORS, UPDATE_AUTHOR } from "../queries";
import Select from "react-select";

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);
  const [editAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      props.setError(error.graphQLErrors);
    },
  });

  const [selectedOption, setSelect] = useState(null);
  const [newName, setName] = useState("");
  const [birth, setBirth] = useState("");

  const submit = (event) => {
    event.preventDefault();
    console.log("submit");
    console.log(selectedOption, birth);
    editAuthor({
      variables: { name: selectedOption.value, born: Number(birth) },
    });

    setName("");
    setBirth("");
  };

  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>loading...</div>;
  }
  console.log(result);

  const authors = result.data.allAuthor;
  const options = authors.map((author) => {
    return { value: author.name, label: author.name };
  });

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {props.token === null ? (
        <></>
      ) : (
        <>
          <h2>Set birthyear</h2>
          <form onSubmit={submit}>
            <div>
              <Select
                defaultValue={selectedOption}
                onChange={setSelect}
                options={options}
              />
            </div>
            <div>
              born
              <input
                value={birth}
                onChange={({ target }) => setBirth(target.value)}
              />
            </div>
            <button type="submit">update author</button>
          </form>
        </>
      )}
    </div>
  );
};

export default Authors;
