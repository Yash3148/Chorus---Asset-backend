// src/user/user.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './schemas/user.entity';
import { UserRepository } from './repository/user.repository';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async registerUser(userData: Partial<User>): Promise<User> {
    try {
      return await this.userRepository.createUser(userData);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('duplicate key value')
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }

  async updateUser(user: User): Promise<User> {
    return this.userRepository.updateUser(user);
  }

  async changePassword(email: string, newPassword: string): Promise<void> {
    // Find the user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user with the new password
    user.password = hashedPassword;
    await this.userRepository.updateUser(user);
  }

  async saveSearch(email: string, searchQuery: string): Promise<void> {
    // Find the user's search record by email
    let userSearch = await this.userRepository.findByEmailSearch(email);

    const userData = { email, searchQueries: [searchQuery] };
    if (!userSearch) {
      // If no record exists, create a new one
      userSearch = await this.userRepository.saveSearch(userData);
    } else {
      if (!userSearch.searchQueries.includes(searchQuery)) {
        // If the search query is not already present, add it
        userSearch.searchQueries.push(searchQuery);
        await this.userRepository.saveSearch(userSearch);
      }
    }
  }

  async getPastSearches(email: string): Promise<string[]> {
    const userSearch = await this.userRepository.getPastSearches(email);
    if (!userSearch || !userSearch.searchQueries) {
      return []; // Return an empty array if there are no search results
    }

    // Return only the last 5 results
    return userSearch.searchQueries.slice(-5).reverse();
  }
}
