// schema.js
import gql from "graphql-tag";

export const typeDefs = gql`
  type Organization {
    id: ID!
    name: String!
  }

  # Define User type
  type User {
    id: ID!
    username: String!
    role: String!
    organizationId: ID!
  }
  type AuthPayload {
    token: String!
    user: User!
  }

  # Define Task type
  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    dueDate: String
    userId: ID!
    organizationId: ID!
  }

  # Queries for fetching data
  type Query {
    organizations: [Organization]
    organization(id: ID!): Organization
    users: [User]
    user(id: ID!): User
    tasks: [Task]
    task(id: ID!): Task
  }

  # Mutations for creating, updating, and deleting data
  type Mutation {
    createOrganization(name: String!): Organization
    updateOrganization(id: ID!, name: String!): Organization
    deleteOrganization(id: ID!): Boolean

    createUser(
      username: String!
      password: String!
      role: String!
      organizationId: ID
    ): AuthPayload!
    updateUser(
      id: ID!
      username: String
      password: String
      role: String
      organizationId: ID
    ): User
    deleteUser(id: ID!): Boolean

    createTask(
      title: String!
      description: String
      status: String!
      dueDate: String
      userId: ID!
      organizationId: ID!
    ): Task
    updateTask(
      id: ID!
      title: String
      description: String
      status: String
      dueDate: String
      userId: ID
      organizationId: ID
    ): Task
    deleteTask(id: ID!): Boolean
  }
`;
