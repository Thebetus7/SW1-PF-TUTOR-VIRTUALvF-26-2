// backend/src/modules/courses/dto/update-course.dto.ts
import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiProperty({ description: 'Título actualizado del curso', required: false, example: 'JavaScript Moderno para Principiantes' })
  @IsOptional()
  @IsString()
  @Length(5, 120, { message: 'El título del curso debe tener entre 5 y 120 caracteres' })
  title?: string;

  @ApiProperty({ description: 'Descripción curricular actualizada', required: false, example: 'Aprende los fundamentos y manipulación del DOM.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Nombre de la categoría', required: false, example: 'Desarrollo Web' })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
