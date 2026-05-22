import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'El nombre del usuario',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'El apellido del usuario',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'El correo electrónico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'john.doe',
    description: 'Nombre de usuario para iniciar sesión',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._-]{3,50}$/, {
    message:
      'El usuario debe tener entre 3 y 50 caracteres y solo puede contener letras, números, punto, guion y guion bajo',
  })
  username: string;

  @ApiProperty({
    example: '573001234567',
    description: 'El número de teléfono del usuario (solo números)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d{1,14}$/, {
    message: 'El número de teléfono debe contener solo números',
  })
  phone: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'La contraseña del usuario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Número de identificación del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  identification?: string;

  @ApiProperty({
    example: 'Calle 123 #45-67',
    description: 'Dirección del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Bogotá',
    description: 'Ciudad del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'Cundinamarca',
    description: 'Estado/Departamento del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: '110111',
    description: 'Código postal del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'URL de la imagen de perfil',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageProfileUrl?: string;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Fecha de nacimiento del usuario (formato ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  birtDate?: Date;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario padre/referente',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  father?: number;

  @ApiProperty({
    example: 1,
    description: 'Lado en el árbol binario (1=izquierda, 2=derecha)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  side?: number;

  @ApiProperty({
    example: true,
    description: 'Estado del usuario (activo/inactivo)',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    example: true,
    description: 'Aceptación de términos y condiciones',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  termsConditions?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID del rol del usuario',
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  roleId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del país del usuario',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  countryId?: number;
}
