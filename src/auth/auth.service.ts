import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;
    
    const existingUser = await this.usersService.findOneByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      ...userData,
      passwordHash,
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('refresh.secret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Access Denied');
      }

      // Check if refresh token matches (optional, but good for security)
      // In this implementation we don't store it in plain text, but we could.
      // For now, simple verification is enough.

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Access Denied');
    }
  }

  private async generateTokens(user: any) {
    const payload = { sub: user._id, email: user.email, role: user.role, tenantId: user.tenantId };
    
    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('refresh.secret'),
      expiresIn: this.configService.get<string>('refresh.expiresIn') as any,
    });

    await this.usersService.updateRefreshToken(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        profilePic: user.profilePic,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // We manually populate or use a better service method if needed
    // For now, let's just use what we have and maybe add a populated find to users service
    return user;
  }
}
