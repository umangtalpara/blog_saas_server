import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ unique: true, sparse: true })
  subdomain?: string;

  @Prop({ unique: true, sparse: true })
  customDomain?: string;

  @Prop({ default: false })
  domainVerified: boolean;

  @Prop({ default: 'free', enum: ['free', 'pro', 'enterprise'] })
  plan: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  subscriptionStatus?: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
