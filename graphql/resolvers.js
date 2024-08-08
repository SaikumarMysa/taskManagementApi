import { generateToken, hashPassword, comparePassword } from './../auth.js';
import User from './../models/userModel.js';
import Organization from './../models/organizationModel.js';
import Task from './../models/taskModel.js';

// Helper function to check roles
const authorize = (user, roles) => {
  if (!user || !roles.includes(user.role)) {
    throw new Error('Unauthorized');
  }
};

export const resolvers = {
  Query: {
    organizations: async (_, __, { user }) => {
      authorize(user, ['Admin']);
      return Organization.find();
    },
    organization: async (_, { id }, { user }) => {
      authorize(user, ['Admin']);
      return Organization.findById(id);
    },
    users: async (_, __, { user }) => {
      authorize(user, ['Admin']);
      return User.find();
    },
    user: async (_, { id }, { user }) => {
      authorize(user, ['Admin']);
      return User.findById(id);
    },
    tasks: async (_, __, { user }) => {
      if (user.role === 'Admin') {
        return Task.find({ organizationId: user.organizationId });
      } else if (user.role === 'Manager') {
        return Task.find({ organizationId: user.organizationId, userId: { $in: user.managedUserIds } });
      } else if (user.role === 'User') {
        return Task.find({ userId: user.id });
      }
      throw new Error('Unauthorized');
    },
    task: async (_, { id }, { user }) => {
      const task = await Task.findById(id);
      if (!task) throw new Error('Task not found');

      if (user.role === 'Admin' || 
          (user.role === 'Manager' && user.managedUserIds.includes(task.userId.toString())) || 
          (user.role === 'User' && task.userId.toString() === user.id.toString())) {
        return task;
      }
      throw new Error('Unauthorized');
    },
  },
  Mutation: {
    createOrganization: async (_, { name }, { user }) => {
      authorize(user, ['Admin']);
      const organization = new Organization({ name });
      return organization.save();
    },
    createUser: async (_, { username, password, role, organizationId }, { user }) => {
      authorize(user, ['Admin']);
      
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        organizationId,
      });

      await newUser.save();

      // Generate JWT token
      const token = generateToken(newUser);

      return {
        token,
        user: newUser,
      };
    },
    updateUser: async (_, { id, username, password, role, organizationId }, { user }) => {
      authorize(user, ['Admin']);
      const hashedPassword = password ? await hashPassword(password) : undefined;
      return User.findByIdAndUpdate(id, { username, password: hashedPassword, role, organizationId }, { new: true });
    },
    deleteUser: async (_, { id }, { user }) => {
      authorize(user, ['Admin']);
      return User.findByIdAndRemove(id);
    },
    createTask: async (_, { title, description, status, dueDate, userId, organizationId }, { user }) => {
      if (user.role === 'Admin' || 
          (user.role === 'Manager' && user.managedUserIds.includes(userId)) || 
          (user.role === 'User' && userId === user.id)) {
        const task = new Task({ title, description, status, dueDate, userId, organizationId });
        return task.save();
      }
      throw new Error('Unauthorized');
    },
    updateTask: async (_, { id, title, description, status, dueDate, userId, organizationId }, { user }) => {
      const task = await Task.findById(id);
      if (!task) throw new Error('Task not found');

      if (user.role === 'Admin' || 
          (user.role === 'Manager' && user.managedUserIds.includes(task.userId.toString())) || 
          (user.role === 'User' && task.userId.toString() === user.id.toString())) {
        const update = { title, description, status, dueDate, userId, organizationId };
        return Task.findByIdAndUpdate(id, update, { new: true });
      }
      throw new Error('Unauthorized');
    },
    deleteTask: async (_, { id }, { user }) => {
      const task = await Task.findById(id);
      if (!task) throw new Error('Task not found');

      if (user.role === 'Admin' || 
          (user.role === 'Manager' && user.managedUserIds.includes(task.userId.toString())) || 
          (user.role === 'User' && task.userId.toString() === user.id.toString())) {
        return Task.findByIdAndRemove(id);
      }
      throw new Error('Unauthorized');
    },
  },
};
