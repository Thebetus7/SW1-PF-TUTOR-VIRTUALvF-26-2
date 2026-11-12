// backend/src/modules/auth/dto/update-credits.dto.ts
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCreditsDto {
  @ApiProperty({
    description: 'Nueva cantidad de créditos para el usuario (entero mayor o igual a 0)',
    example: 10,
  })
  @IsInt({ message: 'El balance de créditos debe ser un número entero' })
  @Min(0, { message: 'El balance de créditos no puede ser negativo' })
  balance: number;
}

