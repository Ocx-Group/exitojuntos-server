import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe',
    description: 'El nombre de usuario',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._-]{3,50}$/, {
    message:
      'El usuario debe tener entre 3 y 50 caracteres y solo puede contener letras, números, punto, guion y guion bajo',
  })
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'La contraseña del usuario',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
