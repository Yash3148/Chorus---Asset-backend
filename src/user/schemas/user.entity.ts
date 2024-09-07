import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  IsEmail,
  IsOptional,
  Matches,
  IsNotEmpty,
  Length,
} from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]*$/, {
    message:
      'First Name must contain only alpha-numeric and special characters.',
  })
  firstName: string;

  @Column()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]*$/, {
    message:
      'Last Name must contain only alpha-numeric and special characters.',
  })
  lastName: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 1, { message: 'Middle Initial must be a single character.' })
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]?$/, {
    message:
      'Middle Initial must contain only alpha-numeric and special characters.',
  })
  middleInitial?: string;

  @Column()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'Hospital ID must contain only alpha-numeric characters.',
  })
  hospitalId: string;

  @Column({ nullable: true })
  @IsOptional()
  @Matches(/^\d{3}-\d{3}-\d{4}$/, {
    message: 'Phone Number must be in the format XXX-XXX-XXXX.',
  })
  phoneNumber?: string;

  @Column({ default: false }) // New field for user verification status
  isUserVerified: boolean;
}
