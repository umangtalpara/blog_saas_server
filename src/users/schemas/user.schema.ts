import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: false })
  tenantId?: string; // Null for super_admin

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: 'viewer' })
  role: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ select: false })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
