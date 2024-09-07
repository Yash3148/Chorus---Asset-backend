import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]*$/, {
    message:
      'First Name must contain only alpha-numeric and special characters.',
  })
  firstName: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]*$/, {
    message:
      'Last Name must contain only alpha-numeric and special characters.',
  })
  lastName: string;

  @IsOptional()
  @Length(1, 1, { message: 'Middle Initial must be a single character.' })
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+=-]?$/, {
    message:
      'Middle Initial must contain only alpha-numeric and special characters.',
  })
  middleInitial?: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'Hospital ID must contain only alpha-numeric characters.',
  })
  hospitalId: string;

  @IsOptional()
  @Matches(/^\d{3}-\d{3}-\d{4}$/, {
    message: 'Phone Number must be in the format XXX-XXX-XXXX.',
  })
  phoneNumber?: string;
}
