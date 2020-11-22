const { ApolloServer, gql, UserInputError, PubSub } = require("apollo-server");
const { v1: uuid } = require("uuid");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const { findOne } = require("./models/book");
const user = require("./models/user");
const pubsub = new PubSub();

const JWT_SECRET = "somethingsekret";
mongoose.set("useFindAndModify", false);

const MONGODB_URI =
  "mongodb+srv://fullstack:Hoangpro123@cluster0.8bd49.mongodb.net/books?retryWrites=true&w=majority";

console.log("connecting to mongodb");

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("error connecting:", error.message);
  });

let authors = [
  {
    name: "Robert Martin",
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky", // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: "Sandi Metz", // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
];

/*
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 */

let books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "crime"],
  },
  {
    title: "The Demon ",
    published: 1872,
    author: "Fyodor Dostoevsky",
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "revolution"],
  },
];

const typeDefs = gql`
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthor: [Author!]!
    me: User
  }

  type Token {
    value: String!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
    genre: String
  }

  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
  }

  type Mutation {
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, born: Int!): Author
    editUserGenre(genre: String!): User
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
  },
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (!args.author && !args.genre) {
        return Book.find({}).populate("author");
      }

      const booksRe = await Book.find({}).populate("author");
      let booksToReturn = args.author
        ? booksRe.filter((book) => book.author.name === args.author)
        : booksRe;

      booksToReturn =
        args.genre === "all"
          ? booksToReturn
          : booksToReturn.filter((book) => book.genres.includes(args.genre));

      return booksToReturn;
    },
    allAuthor: (root) => {
      console.log("query");
      return Author.find({});
    },
    me: (root, args, { currentUser }) => {
      return user.findOne({ username: currentUser.username });
    },
  },
  Author: {
    bookCount: async (root) => {
      const booksRe = await Book.find({}).populate("author");
      return booksRe.filter((book) => book.author.name === root.name).length;
    },
  },
  Mutation: {
    createUser: async (root, { username, favoriteGenre }) => {
      if (!username) {
        throw new UserInputError("no username present");
      }
      if (username < 3) {
        throw new UserInputError("username is too short");
      }
      const user = new User({ username, favoriteGenre });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, { username, password }) => {
      const user = await User.findOne({ username: username });

      if (!user || password !== "secret") {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
    addBook: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new UserInputError("unauthenticated");
      }

      if (args.author.length < 3) {
        throw new UserInputError("Author name is too short!");
      }

      if (args.title.length < 2) {
        throw new UserInputError("Book title is too short!");
      }

      const authorExistCheck = await Author.findOne({ name: args.author });
      let author;
      if (authorExistCheck) {
        author = await Author.findOne({ name: args.author });
      } else {
        author = new Author({ name: args.author, born: null, bookCount: 1 });
        try {
          await author.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidaArgs: args,
          });
        }
      }
      const book = new Book({
        ...args,
        author: author._id,
      });

      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidaArgs: args,
        });
      }

      pubsub.publish("BOOK_ADDED", { bookAdded: book });

      return Book.findOne({ title: args.title }).populate("author");
    },
    editUserGenre: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new UserInputError("unauthenticated");
      }
      const user = await User.findOne({ username: currentUser.username });
      if (!user) {
        return null;
      }

      try {
        await User.findOneAndUpdate(
          { username: currentUser.username },
          { genre: args.genre }
        );
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidaArgs: args,
        });
      }

      return { ...args };
    },
    editAuthor: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new UserInputError("unauthenticated");
      }
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }

      try {
        await Author.findOneAndUpdate({ name: args.name }, { born: args.born });
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidaArgs: args,
        });
      }

      return { ...args };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscription ready at ${subscriptionsUrl}`);
});
