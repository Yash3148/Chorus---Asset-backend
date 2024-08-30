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

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Find the user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user with the new password
    user.password = hashedPassword;
    await this.userRepository.updateUser(user);
  }
}
