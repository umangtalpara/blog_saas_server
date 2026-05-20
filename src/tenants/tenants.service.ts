import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RequestTenantDto } from './dto/request-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantDocument> {
    const existingTenant = await this.tenantModel.findOne({
      $or: [
        { name: createTenantDto.name },
        { slug: createTenantDto.slug },
      ],
    }).exec();

    if (existingTenant) {
      throw new ConflictException('Tenant with this name or slug already exists');
    }

    const createdTenant = new this.tenantModel(createTenantDto);
    return createdTenant.save();
  }

  async requestAccess(requestDto: RequestTenantDto): Promise<TenantDocument> {
    const existingTenant = await this.tenantModel.findOne({
      $or: [
        { name: requestDto.name },
        { slug: requestDto.slug },
      ],
    }).exec();

    if (existingTenant) {
      throw new ConflictException('Tenant with this name or slug already exists');
    }

    const createdTenant = new this.tenantModel({
      name: requestDto.name,
      slug: requestDto.slug,
      status: 'pending',
      settings: {
        adminName: requestDto.adminName,
        adminEmail: requestDto.adminEmail,
      },
    });
    return createdTenant.save();
  }

  async approve(id: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    tenant.status = 'active';
    return tenant.save();
  }

  async update(id: string, updateTenantDto: any): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findByIdAndUpdate(id, updateTenantDto, { new: true }).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findAll(): Promise<TenantDocument[]> {
    return this.tenantModel.find().exec();
  }

  async findOne(id: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ slug }).exec();
  }

  async findByCustomDomain(domain: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ customDomain: domain }).exec();
  }

  async findBySubdomain(subdomain: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ subdomain }).exec();
  }
}
