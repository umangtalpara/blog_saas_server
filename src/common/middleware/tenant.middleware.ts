import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';
import { TenantDocument } from '../../tenants/schemas/tenant.schema';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const path = req.path;

    let tenant: TenantDocument | null = null;

    // 1. Find by Custom Domain
    if (host && !host.includes('localhost') && !host.includes('blogerp.com')) {
      tenant = await this.tenantsService.findByCustomDomain(host);
    }

    // 2. Find by Subdomain
    if (!tenant && host.includes('.blogerp.com')) {
      const subdomain = host.split('.')[0];
      tenant = await this.tenantsService.findBySubdomain(subdomain);
    }

    // 3. Find by Header (useful for SPA testing/path-based)
    if (!tenant && req.headers['x-tenant-slug']) {
      tenant = await this.tenantsService.findBySlug(req.headers['x-tenant-slug'] as string);
    }

    // 4. Find by Path (OptionalFallback for certain API routes)
    if (!tenant && req.path.startsWith('/public/blogs/')) {
      // This is tricky because the path is /public/blogs/:slug where :slug is the blog slug, not tenant
    }
    
    if (tenant) {
      (req as any).tenant = tenant;
    }

    next();
  }
}
