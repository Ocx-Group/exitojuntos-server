import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Adolfo Moreno' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Licenciado en Finanzas' })
  @IsString()
  @MaxLength(160)
  role!: string;

  @ApiProperty({
    example:
      'Exito Juntos cambió completamente mi perspectiva sobre las inversiones.',
  })
  @IsString()
  @MaxLength(1200)
  quote!: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=abc123',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  videoUrl?: string;

  @ApiProperty({ example: 5, required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
