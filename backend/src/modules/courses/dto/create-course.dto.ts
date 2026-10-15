// backend/src/modules/courses/dto/create-course.dto.ts
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @Length(5, 120, { message: 'El título del curso debe tener entre 5 y 120 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción del curso es obligatoria' })
  description: string;

  @IsOptional()
  @IsString()
  categoryName?: string; // Selector tridimensional: si no se provee o catálogo vacío, fallback "General"
}
