import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './schemas/user.entity';
import { UserRepository } from './repository/user.repository';
import { UserSearch } from './schemas/user.search.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSearch, User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
