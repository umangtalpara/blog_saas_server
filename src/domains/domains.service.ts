import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Domain, DomainDocument } from './schemas/domain.schema';
import { CreateDomainDto } from './dto/create-domain.dto';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { PLAN_LIMITS } from '../billing/plan-limits';
import * as crypto from 'crypto';
import * as dns from 'dns/promises';

@Injectable()
export class DomainsService {
  constructor(
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(tenantId: string, createDomainDto: CreateDomainDto): Promise<DomainDocument> {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = tenant.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (!limits.customDomains) {
      throw new ForbiddenException(`Custom domains are not available on the ${plan} plan. Please upgrade to Pro or Enterprise.`);
    }

    const existingDomain = await this.domainModel.findOne({ domain: createDomainDto.domain }).exec();
    if (existingDomain) {
      throw new ConflictException('Domain is already registered');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const createdDomain = new this.domainModel({
      ...createDomainDto,
      tenantId,
      verificationToken,
    });
    
    return createdDomain.save();
  }

  async findAll(tenantId: string): Promise<DomainDocument[]> {
    return this.domainModel.find({ tenantId }).exec();
  }

  async verify(tenantId: string, domainId: string): Promise<DomainDocument> {
    const domain = await this.domainModel.findOne({ _id: domainId, tenantId }).exec();
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    if (domain.verified) {
      return domain;
    }

    try {
      // Check for TXT record: blogerp-verification=token
      const records = await dns.resolveTxt(domain.domain);
      const expectedRecord = `blogerp-verification=${domain.verificationToken}`;
      
      const isVerified = records.some(recordSet => 
        recordSet.some(record => record === expectedRecord)
      );

      if (!isVerified) {
        throw new BadRequestException('Verification TXT record not found');
      }

      domain.verified = true;
      domain.verifiedAt = new Date();
      return domain.save();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`DNS resolution failed: ${error.message}`);
    }
  }

  async remove(tenantId: string, domainId: string): Promise<void> {
    const result = await this.domainModel.deleteOne({ _id: domainId, tenantId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Domain not found');
    }
  }
}
