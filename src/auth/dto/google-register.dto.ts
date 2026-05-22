import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RegisterDto } from './register.dto';

export class GoogleRegisterDto extends OmitType(RegisterDto, [
  'password',
] as const) {
  @ApiProperty({
    description: 'Google ID token devuelto por Google Sign-In',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
