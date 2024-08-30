import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../schemas/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
    return this.repository.save(userData);
  }

  async findByEmail(email: string): Promise<User> {
    return this.repository.findOne({ where: { email } });
  }

  async updateUser(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
