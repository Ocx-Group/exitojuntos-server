import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Country } from './entities/country.entity';
import { EmailAttachment, EmailService } from '../email';
import { getWelcomeEmailTemplate } from '../email/templates/welcome-email.template';
import { getPasswordResetEmailTemplate } from '../email/templates/password-reset-email.template';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const {
      name,
      lastName,
      email,
      phone: rawPhone,
      password,
      identification,
      address,
      city,
      state,
      zipCode,
      imageProfileUrl,
      birtDate,
      father,
      roleId,
      countryId,
    } = registerDto;

    const phone = rawPhone.replace(/^\+/, '');

    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ConflictException('El número de teléfono ya está registrado');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new ConflictException('El rol especificado no existe');
    }

    let country: Country | null = null;
    if (countryId) {
      country = await this.countryRepository.findOne({
        where: { id: countryId },
      });

      if (!country) {
        throw new ConflictException('El país especificado no existe');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      name,
      lastName,
      email,
      phone,
      password: hashedPassword,
      identification,
      address,
      city,
      state,
      zipCode,
      imageProfileUrl,
      birtDate,
      father,
      role,
      status: false,
      verificationCode: this.generateVerificationCode(),
      termsConditions: true,
      side: 0,
      ...(country && { country }),
    });

    await this.userRepository.save(newUser);

    Promise.race([
      this.sendWelcomeEmail(newUser, password),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email timeout')), 3000),
      ),
    ]).catch((error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Email encolado en segundo plano para ${newUser.email}: ${errorMessage}`,
      );
    });

    const payload: JwtPayload = {
      sub: newUser.id.toString(),
      phone: newUser.phone,
      role: newUser.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: newUser.id.toString(),
        name: newUser.name,
        phone: newUser.phone,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { phone, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { phone },
      relations: ['role', 'country'],
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        identification: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        imageProfileUrl: true,
        birtDate: true,
        father: true,
        side: true,
        status: true,
        termsConditions: true,
        password: true,
        role: { id: true, name: true },
        country: { id: true, name: true },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      phone: user.phone,
      role: user.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return { access_token, user: userWithoutPassword };
  }

  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: Number.parseInt(userId) },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id.toString(),
      name: user.name,
      phone: user.phone,
      role: user.role.name,
    };
  }

  async verifyEmail(
    code: string,
  ): Promise<{ message: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { verificationCode: code },
      relations: ['role', 'country'],
    });

    if (!user) {
      throw new NotFoundException('Código de verificación inválido o expirado');
    }

    if (user.status) {
      throw new ConflictException('Esta cuenta ya ha sido verificada');
    }

    user.status = true;
    user.verificationCode = undefined;
    await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    this.logger.log(`Usuario ${user.email} verificado exitosamente`);

    return {
      message: 'Cuenta activada exitosamente',
      user: userWithoutPassword,
    };
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return {
        message:
          'Si el email existe, recibirás un código para restablecer tu contraseña',
      };
    }

    if (!user.status) {
      throw new UnauthorizedException(
        'Tu cuenta no está activa. Por favor verifica tu email primero',
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await this.userRepository.save(user);

    await this.sendPasswordResetEmail(user, resetCode);

    this.logger.log(`Código de reset enviado a ${user.email}`);

    return {
      message:
        'Si el email existe, recibirás un código para restablecer tu contraseña',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { code, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { resetPasswordCode: code },
    });

    if (!user) {
      throw new NotFoundException('Código de seguridad inválido o expirado');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('El código de seguridad ha expirado');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await this.userRepository.save(user);

    this.logger.log(`Contraseña restablecida para ${user.email}`);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  private generateVerificationCode(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async sendWelcomeEmail(
    user: User,
    plainPassword: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const welcomeEmailHtml = getWelcomeEmailTemplate({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: plainPassword,
      verificationCode: user.verificationCode || '',
      frontendUrl,
    });

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const termsFilePath = path.join(
      process.cwd(),
      isDevelopment ? 'src' : 'dist',
      'assets',
      'docs',
      'terminos-condiciones.pdf',
    );

    let attachments: EmailAttachment[] = [];

    try {
      const fileBuffer = await fs.readFile(termsFilePath);
      attachments = [
        {
          name: 'Terminos_y_Condiciones.pdf',
          content: fileBuffer.toString('base64'),
        },
      ];
      this.logger.log(`PDF adjuntado para ${user.email}`);
    } catch {
      this.logger.warn(
        `PDF no encontrado en ${termsFilePath}, enviando email sin adjunto`,
      );
    }

    await this.emailService.queueEmail({
      to: [{ email: user.email, name: `${user.name} ${user.lastName}` }],
      subject: '¡Bienvenido a Éxito Juntos!',
      htmlContent: welcomeEmailHtml,
      attachments,
    });

    this.logger.log(`Email con PDF encolado correctamente para ${user.email}`);
  }

  private async sendPasswordResetEmail(
    user: User,
    resetCode: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const passwordResetEmailHtml = getPasswordResetEmailTemplate({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      resetCode,
      frontendUrl,
    });

    await this.emailService.queueEmail({
      to: [{ email: user.email, name: `${user.name} ${user.lastName}` }],
      subject: 'Restablecer Contraseña - Éxito Juntos',
      htmlContent: passwordResetEmailHtml,
    });

    this.logger.log(`Email de reset de contraseña encolado para ${user.email}`);
  }
}
