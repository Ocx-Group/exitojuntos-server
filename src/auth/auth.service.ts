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
import { createVerify } from 'node:crypto';
import {
  GoogleRegisterDto,
  GoogleLoginDto,
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
  private googleCertificates: Record<string, string> = {};
  private googleCertificatesExpiresAt = 0;

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
      username: rawUsername,
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

    const username = rawUsername.trim().toLowerCase();
    const phone = rawPhone.replace(/^\+/, '');

    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

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
      username,
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
      username: newUser.username,
      phone: newUser.phone,
      role: newUser.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: newUser.id.toString(),
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username: rawUsername, password } = loginDto;
    const username = rawUsername.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['role', 'country'],
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        username: true,
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
        googleId: true,
        authProvider: true,
        role: { id: true, name: true },
        country: { id: true, name: true },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
      phone: user.phone,
      role: user.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return { access_token, user: userWithoutPassword };
  }

  async googleLogin(googleLoginDto: GoogleLoginDto): Promise<AuthResponse> {
    const googleUser = await this.verifyGoogleIdToken(googleLoginDto.idToken);

    if (!googleUser.email || googleUser.email_verified !== true) {
      throw new UnauthorizedException('La cuenta de Google no está verificada');
    }

    const user = await this.userRepository.findOne({
      where: [{ googleId: googleUser.sub }, { email: googleUser.email }],
      relations: ['role', 'country'],
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        username: true,
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
        googleId: true,
        authProvider: true,
        role: { id: true, name: true },
        country: { id: true, name: true },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'No existe un usuario registrado con este correo de Google',
      );
    }

    if (!user.googleId) {
      user.googleId = googleUser.sub;
      user.authProvider =
        user.authProvider === 'local' ? 'local_google' : 'google';
      await this.userRepository.save(user);
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
      phone: user.phone,
      role: user.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, user };
  }

  async googleRegister(
    googleRegisterDto: GoogleRegisterDto,
  ): Promise<AuthResponse> {
    const googleUser = await this.verifyGoogleIdToken(
      googleRegisterDto.idToken,
    );

    if (!googleUser.email || googleUser.email_verified !== true) {
      throw new UnauthorizedException('La cuenta de Google no está verificada');
    }

    const email = googleUser.email.trim().toLowerCase();
    const requestedEmail = googleRegisterDto.email.trim().toLowerCase();

    if (requestedEmail !== email) {
      throw new UnauthorizedException(
        'El correo del formulario no coincide con Google',
      );
    }

    const username = googleRegisterDto.username.trim().toLowerCase();
    const phone = googleRegisterDto.phone.replace(/^\+/, '');

    await this.ensureUserDoesNotExist({
      username,
      phone,
      email,
      googleId: googleUser.sub,
    });

    const role = await this.roleRepository.findOne({
      where: { id: googleRegisterDto.roleId },
    });

    if (!role) {
      throw new ConflictException('El rol especificado no existe');
    }

    let country: Country | null = null;
    if (googleRegisterDto.countryId) {
      country = await this.countryRepository.findOne({
        where: { id: googleRegisterDto.countryId },
      });

      if (!country) {
        throw new ConflictException('El país especificado no existe');
      }
    }

    const newUser = this.userRepository.create({
      name: googleRegisterDto.name,
      lastName: googleRegisterDto.lastName,
      email,
      username,
      phone,
      password: null,
      identification: googleRegisterDto.identification,
      address: googleRegisterDto.address,
      city: googleRegisterDto.city,
      state: googleRegisterDto.state,
      zipCode: googleRegisterDto.zipCode,
      imageProfileUrl: googleRegisterDto.imageProfileUrl || googleUser.picture,
      birtDate: googleRegisterDto.birtDate,
      father: googleRegisterDto.father,
      role,
      status: true,
      verificationCode: undefined,
      termsConditions: true,
      side: googleRegisterDto.side ?? 0,
      googleId: googleUser.sub,
      authProvider: 'google',
      ...(country && { country }),
    });

    await this.userRepository.save(newUser);

    const payload: JwtPayload = {
      sub: newUser.id.toString(),
      username: newUser.username,
      phone: newUser.phone,
      role: newUser.role.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, user: newUser };
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
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
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

  private async ensureUserDoesNotExist({
    username,
    phone,
    email,
    googleId,
  }: {
    username: string;
    phone: string;
    email: string;
    googleId: string;
  }): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { phone }, { email }, { googleId }],
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        googleId: true,
      },
    });

    if (!existingUser) {
      return;
    }

    if (existingUser.googleId === googleId) {
      throw new ConflictException('Esta cuenta de Google ya está registrada');
    }

    if (existingUser.username === username) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    if (existingUser.phone === phone) {
      throw new ConflictException('El número de teléfono ya está registrado');
    }

    throw new ConflictException('El correo electrónico ya está registrado');
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<GoogleIdTokenPayload> {
    const [encodedHeader, encodedPayload, encodedSignature] =
      idToken.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const header = this.decodeJwtPart<GoogleJwtHeader>(encodedHeader);
    const payload = this.decodeJwtPart<GoogleIdTokenPayload>(encodedPayload);
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new UnauthorizedException('Google Sign-In no está configurado');
    }

    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const certificates = await this.getGoogleCertificates();
    const certificate = certificates[header.kid];

    if (!certificate) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();

    const isSignatureValid = verifier.verify(
      certificate,
      this.base64UrlToBuffer(encodedSignature),
    );

    if (!isSignatureValid) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];

    if (
      payload.aud !== clientId ||
      !validIssuers.includes(payload.iss) ||
      payload.exp <= nowInSeconds ||
      payload.iat > nowInSeconds
    ) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    return payload;
  }

  private async getGoogleCertificates(): Promise<Record<string, string>> {
    if (
      Date.now() < this.googleCertificatesExpiresAt &&
      Object.keys(this.googleCertificates).length > 0
    ) {
      return this.googleCertificates;
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v1/certs');

    if (!response.ok) {
      throw new UnauthorizedException('No se pudo validar Google Sign-In');
    }

    this.googleCertificates = (await response.json()) as Record<string, string>;
    this.googleCertificatesExpiresAt =
      Date.now() + this.getMaxAgeInMilliseconds(response);

    return this.googleCertificates;
  }

  private getMaxAgeInMilliseconds(response: Response): number {
    const cacheControl = response.headers.get('cache-control') ?? '';
    const maxAgeMatch = /max-age=(\d+)/.exec(cacheControl);
    const defaultMaxAgeSeconds = 3600;
    const maxAgeSeconds = maxAgeMatch
      ? Number(maxAgeMatch[1])
      : defaultMaxAgeSeconds;

    return maxAgeSeconds * 1000;
  }

  private decodeJwtPart<T>(encodedPart: string): T {
    try {
      const decodedJson: unknown = JSON.parse(
        this.base64UrlToBuffer(encodedPart).toString('utf8'),
      );

      return decodedJson as T;
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }
  }

  private base64UrlToBuffer(value: string): Buffer {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    return Buffer.from(padded, 'base64');
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
      username: user.username,
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

interface GoogleJwtHeader {
  alg: string;
  kid: string;
  typ?: string;
}

interface GoogleIdTokenPayload {
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}
