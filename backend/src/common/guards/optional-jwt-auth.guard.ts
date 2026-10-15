// backend/src/common/guards/optional-jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Si no hay token o falló la verificación, no lanzamos UnauthorizedException, simplemente retornamos el usuario o null
    return user || null;
  }
}
