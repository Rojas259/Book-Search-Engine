const { AuthenticationError } = require('apollo-server-errors');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    user: async (parent, { username }) => {
      return User.findOne({ username }).populate('savedBooks');
    },
    me: async(parent, args, context) => {
      return User.findOne({_id: context.user._id}).populate('savedBooks')
    }
  },

  Mutation: {
    addUser: async ({ username, email, password }) => {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email });

        if (!user || !user.isCorrectPassword(password)) {
            throw new AuthenticationError('Incorrect email or password');
            }
        const token = signToken(user);
        return { token, user };
    },
    saveBook: async (_, { book }, context) => {
        if (!context.user) {
            throw new AuthenticationError('You need to be logged in!');
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: book } },
            { new: true, runValidators: true }
        );

        return updatedUser;
    },

      removeBook: async (parent, { bookId }, context) => {
        if (!context.user) {
          throw new AuthenticationError('You need to be logged in!');
        }

        const book = await Book.findOneAndDelete({ _id: bookId });

        if (!book) {
          throw new Error('Book not found');
        }

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: book._id } }
        );

        return book;
      },
    },
  };

  module.exports = resolvers;