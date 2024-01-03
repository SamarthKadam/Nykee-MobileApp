const graphql = require("graphql");
const { GraphQLObjectType, GraphQLString, GraphQLID } = graphql;
const { signToken } = require("../../utils/getToken");
const User = require("../../models/userModel");
const Shoe = require("../../models/shoeModel");
const UserType = require("../types/user_type");
const ShoeType = require("../types/shoe_type");
const jwt=require('jsonwebtoken');
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createUser: {
      type: UserType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parentValue, { name, email, password }) {
        const user = await User.create({
          name: name,
          email: email,
          password: password,
        });
        const token = signToken(user._id);
        return {
          id: user._id,
          token: token,
          name:user.name
        };
      },
    },
    loginUser: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parentValue, { email, password }) {

        const user=await User.findOne({email}).select('+password');
        if(!user || !(await user.correctPassword(user.password,password)))
        {
            throw new Error("User No Longer Exist");
        }
        const token=signToken(user._id);
        return {id:user._id,token,name:user.name}
      },
    },
    tokenToUser:{
      type:UserType,
      args:{
        token:{type:GraphQLString}
      },
      async resolve(parentValue,{token})
      {
        const decode=jwt.verify(token,process.env.JWTSECRET)
        const freshUser=await User.findById(decode.id);
        return {name:freshUser.name,id:freshUser._id};
      }
    },
    addToFavourites: {
      type: UserType,
      args: {
        id: { type: GraphQLID },
        shoeId: { type: GraphQLID },
      },
      async resolve(parentValue, { id, shoeId }) {
        try {
          const user = await User.findById(id);
          if (!user) {
            throw new Error("User not found");
          }

          if (user.favourites.includes(shoeId)) {
            return user.populate("favourites");
          }

          user.favourites.push(shoeId);
          await user.save();

          return user.populate("favourites");
        } catch (err) {
          throw new Error(err);
        }
      },
    },
    addToCart: {
      type: UserType,
      args: {
        id: { type: GraphQLID },
        shoeId: { type: GraphQLID },
      },
      async resolve(parentValue, { id, shoeId }) {
        try {
          const user = await User.findById(id);
          if (!user) {
            throw new Error("User not found");
          }

          user.cartItems.push(shoeId);
          await user.save();

          return user.populate("cartItems");
        } catch (err) {
          throw new Error(err);
        }
      },
    },
    removefromFavourites:{
      type:UserType,
      args:{
        id:{type:GraphQLID},
        shoeId:{type:GraphQLID}
      },
      async resolve(parentValue, { id, shoeId }) {
        try {
          const user = await User.findById(id);
          if (!user) {
            throw new Error("User not found");
          }

          user.favourites.pop(shoeId);
          await user.save();

          return user
        } catch (err) {
          throw new Error(err);
        }
      },
    }
  },
});

module.exports = mutation;
