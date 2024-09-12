import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('userSearches')
export class UserSearch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string; // Use email as the unique identifier

  @Column('text', { array: true, default: () => "'{}'" }) // Define the column as an array
  searchQueries: string[];
}
