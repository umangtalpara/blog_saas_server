import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'admin@blogerp.com';
  const password = 'password123';
  
  const existingUser = await usersService.findOneByEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);
  
  if (existingUser) {
    await usersService.updatePassword(existingUser._id.toString(), passwordHash);
    console.log('Super admin password reset successfully');
  } else {
    await usersService.create({
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'super_admin',
      status: 'active',
    });
    console.log('Super admin created successfully');
  }
  console.log('Email: ' + email);
  console.log('Password: ' + password);

  await app.close();
}

bootstrap();
