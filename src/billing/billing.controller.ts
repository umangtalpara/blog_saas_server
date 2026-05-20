import { Controller, Post, Body, UseGuards, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Stripe Checkout session' })
  createCheckoutSession(@GetUser('tenantId') tenantId: string, @Body('plan') plan: string) {
    return this.billingService.createCheckoutSession(tenantId, plan);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('create-portal-session')
  @ApiOperation({ summary: 'Create a Stripe Customer Portal session' })
  createPortalSession(@GetUser('tenantId') tenantId: string) {
    return this.billingService.createPortalSession(tenantId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody, signature);
  }
}
