import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DomainDocument = Domain & Document;

@Schema({ timestamps: true })
export class Domain {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: string;

  @Prop({ required: true, unique: true })
  domain: string;

  @Prop({ default: 'custom', enum: ['subdomain', 'custom'] })
  type: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true })
  verificationToken: string;

  @Prop()
  verifiedAt?: Date;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

DomainSchema.index({ tenantId: 1 });
