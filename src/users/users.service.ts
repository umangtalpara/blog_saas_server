import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: any): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+passwordHash').exec();
  }

  async findAll(tenantId?: string): Promise<UserDocument[]> {
    const filter = tenantId ? { tenantId } : {};
    return this.userModel.find(filter).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('tenantId').exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, { passwordHash }, { new: true }).exec();
  }

  async update(userId: string, updateData: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }
}
