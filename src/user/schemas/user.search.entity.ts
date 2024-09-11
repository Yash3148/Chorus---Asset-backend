import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('user_searches')
export class UserSearch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string; // Use email as the unique identifier

  @Column('text', { array: true, default: () => "'{}'" }) // Define the column as an array
  searchQueries: string[];

  //   // Many-to-One relationship with User
  //   @ManyToOne(() => User, (user) => user.searches)
  //   user: User;  // Reference to User entity
}
