// backend/src/modules/analytics/dto/register-device.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  pushToken: string;
}
