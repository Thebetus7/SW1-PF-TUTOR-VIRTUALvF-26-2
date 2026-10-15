// backend/src/modules/payments/payments.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SubscriptionStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_key_skylearn';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RF-09.1: Genera sesión de pago simulada con Stripe en modo desarrollador
   * con tarjeta universal de pruebas: 4242 4242 4242 4242.
   */
  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;

    this.logger.log(`Checkout creado en Stripe Developer Mode para usuario: ${userId}`);

    return {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      developerModeNotice: 'Modo de Pruebas de Stripe habilitado. Usa la tarjeta 4242 4242 4242 4242 con cualquier fecha futura y CVC 123.',
      testCard: {
        number: '4242 4242 4242 4242',
        expiry: '12/28',
        cvc: '123',
      },
      plan: {
        name: 'Suscripción Ilimitada Skylearn',
        priceUsd: 9.99,
        interval: 'monthly',
      },
      clientSecret: `pi_test_${crypto.randomBytes(8).toString('hex')}_secret_${crypto.randomBytes(10).toString('hex')}`,
    };
  }

  /**
   * RF-09.2: Procesa webhooks de Stripe con control de idempotencia y verificación de firma
   */
  async handleWebhook(eventPayload: any, signatureHeader?: string) {
    const eventId = eventPayload?.id;

    if (!eventId) {
      throw new BadRequestException('Payload de evento inválido: id faltante');
    }

    // 1. Verificación de firma HMAC-SHA256 (si viene encabezado de firma)
    if (signatureHeader) {
      const isValidSignature = this.verifyStripeSignature(
        JSON.stringify(eventPayload),
        signatureHeader,
        this.webhookSecret,
      );
      if (!isValidSignature) {
        this.logger.error('Firma de webhook de Stripe inválida');
        throw new BadRequestException('Firma de webhook inválida');
      }
    }

    // 2. Control estricto de idempotencia
    const alreadyProcessed = await this.prisma.processedWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (alreadyProcessed) {
      this.logger.warn(`Evento ${eventId} ya fue procesado previamente. Omitiendo duplicado.`);
      return { received: true, duplicate: true, status: 'ALREADY_PROCESSED' };
    }

    // 3. Procesar activación de suscripción
    const eventType = eventPayload.type;
    this.logger.log(`Procesando evento de Stripe: ${eventType} (ID: ${eventId})`);

    if (
      eventType === 'checkout.session.completed' ||
      eventType === 'customer.subscription.created' ||
      eventType === 'invoice.payment_succeeded'
    ) {
      const sessionData = eventPayload.data?.object;
      const userId =
        sessionData?.client_reference_id ||
        sessionData?.metadata?.userId ||
        sessionData?.userId;

      if (userId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.prisma.subscription.upsert({
          where: { userId },
          update: {
            status: SubscriptionStatus.ACTIVE,
            stripeCustomerId: sessionData?.customer || 'cus_test_demo',
            stripeSubscriptionId: sessionData?.subscription || 'sub_test_demo',
            currentPeriodEnd: expiresAt,
          },
          create: {
            userId,
            status: SubscriptionStatus.ACTIVE,
            stripeCustomerId: sessionData?.customer || 'cus_test_demo',
            stripeSubscriptionId: sessionData?.subscription || 'sub_test_demo',
            currentPeriodEnd: expiresAt,
          },
        });

        this.logger.log(`Suscripción activada para el usuario ${userId}`);
      }
    }

    // 4. Marcar evento como procesado para idempotencia
    await this.prisma.processedWebhookEvent.create({
      data: { id: eventId },
    });

    return { received: true, status: 'PROCESSED' };
  }

  /**
   * Helper para verificar la firma v1 de Stripe con HMAC-SHA256
   */
  private verifyStripeSignature(payloadStr: string, header: string, secret: string): boolean {
    try {
      // El header de Stripe viene en formato: t=123456,v1=signature_hash
      const parts = header.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !sigPart) {
        return false;
      }

      const timestamp = timestampPart.replace('t=', '');
      const expectedSig = sigPart.replace('v1=', '');

      const signedPayload = `${timestamp}.${payloadStr}`;
      const hmac = crypto.createHmac('sha256', secret);
      const computedSig = hmac.update(signedPayload).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig));
    } catch {
      return false;
    }
  }

  /**
   * Helper exportado para pruebas: genera un encabezado de firma válido
   */
  generateTestSignature(payloadStr: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payloadStr}`;
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const computedSig = hmac.update(signedPayload).digest('hex');
    return `t=${timestamp},v1=${computedSig}`;
  }
}
