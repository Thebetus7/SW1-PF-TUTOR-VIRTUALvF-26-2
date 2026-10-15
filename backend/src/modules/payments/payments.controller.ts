// backend/src/modules/payments/payments.controller.ts
import { Controller, Post, Body, Headers, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Pasarela de Pagos (Stripe Developer Mode)')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear sesión de Checkout en Stripe modo desarrollador con tarjeta de prueba 4242 4242 4242 4242',
  })
  @ApiResponse({ status: 201, description: 'Sesión creada con éxito' })
  async createCheckout(@Request() req: any, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckoutSession(req.user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook idempotente de Stripe para activación de suscripción de lecciones ilimitadas',
  })
  @ApiResponse({ status: 200, description: 'Evento procesado de forma idempotente' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
