import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../schemas/user.entity';
import { UserSearch } from '../schemas/user.search.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSearch)
    private readonly userSearchRepository: Repository<UserSearch>,
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
    return this.userRepository.save(userData);
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async findByEmailSearch(email: string): Promise<UserSearch> {
    return this.userSearchRepository.findOne({ where: { email } });
  }

  async saveSearch(userData: Partial<User>): Promise<UserSearch> {
    return this.userSearchRepository.save(userData);
  }

  async getPastSearches(email: string): Promise<UserSearch> {
    const userSearch = await this.userSearchRepository.findOne({
      where: { email },
    });
    return userSearch;
  }
}
