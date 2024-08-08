import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit"; 
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { handleError } from "./errorHandler.js";
import { verifyToken } from "./auth.js"; 

dotenv.config({ path: "./config.env" });

const app = express();

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 100, // Limiting each IP to 100 requests per `windowMs`
  message: "Too many requests from this IP, please try again later!!.",
});

// Applying rate limiter to all requests
app.use(apiLimiter);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Create an instance of ApolloServer
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get the token from the headers
    const token = req.headers.authorization || '';

    // Verify the token and get the user
    let user = null;
    if (token) {
      try {
        user = verifyToken(token.replace('Bearer ', ''));
      } catch (error) {
        // Handle error if token is invalid
        console.error("Invalid token", error);
      }
    }

    // Return the user in the context
    return { user };
  },
});

// Start the Apollo Server and integrate it with Express
async function startServer() {
  try {
    await server.start();
    app.use("/graphql", expressMiddleware(server)); // Integrate Apollo Server with Express

    const port = process.env.PORT || 8008;

    // MongoDB connection string
    const DB = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    // Connect to MongoDB
    mongoose
      .connect(DB)
      .then(() => {
        console.log("DB connection successful");

        // Start Express server
        app.listen(port, () => {
          console.log(`Server running on port ${port}`);
        });
      })
      .catch((err) => {
        console.error("DB connection error:", err);
        process.exit(1);
      });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  handleError(err, res);
});

startServer();
