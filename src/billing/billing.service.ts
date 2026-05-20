import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class BillingService {
  private stripe: any;

  constructor(
    private configService: ConfigService,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {
    this.stripe = new (Stripe as any)(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createCheckoutSession(tenantId: string, plan: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    let customerId = tenant.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: (tenant as any).email || `${tenant.slug}@blogerp.com`, // Fallback email
        name: tenant.name,
        metadata: { tenantId: tenant._id.toString() },
      });
      customerId = customer.id;
      tenant.stripeCustomerId = customerId;
      await tenant.save();
    }

    const priceId = this.configService.get<string>(`${plan.toUpperCase()}_PLAN_PRICE_ID`);
    if (!priceId) throw new BadRequestException('Invalid plan selected');

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.configService.get('APP_URL')}/admin/billing?success=true`,
      cancel_url: `${this.configService.get('APP_URL')}/admin/billing?canceled=true`,
      metadata: { tenantId: tenant._id.toString(), plan },
    });

    return { url: session.url };
  }

  async createPortalSession(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant || !tenant.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${this.configService.get('APP_URL')}/admin/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: any, signature: string) {
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '',
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        await this.updateSubscription(session);
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        const subscription = event.data.object as any;
        await this.syncSubscription(subscription);
        break;
    }

    return { received: true };
  }

  private async updateSubscription(session: any) {
    const tenantId = session.metadata?.tenantId;
    const plan = session.metadata?.plan;
    if (tenantId) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        plan,
        stripeSubscriptionId: session.subscription as string,
        subscriptionStatus: 'active',
      });
    }
  }

  private async syncSubscription(subscription: any) {
    const customerId = subscription.customer as string;
    const status = subscription.status;
    
    // Find tenant by customerId
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (tenant) {
      tenant.subscriptionStatus = status;
      if (status !== 'active') {
        tenant.plan = 'free'; // Downgrade if not active
      }
      await tenant.save();
    }
  }
}
