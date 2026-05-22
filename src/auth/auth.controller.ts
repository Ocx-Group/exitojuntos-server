import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  GoogleLoginDto,
  GoogleRegisterDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto';

@ApiTags('Autenticación')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    operationId: 'register',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '1',
          name: 'John Doe',
          username: 'john.doe',
          phone: '+573001234567',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email del usuario' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: 'Código de verificación enviado al email',
    example: 'abc123def456ghi789',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente',
    schema: {
      example: {
        message: 'Cuenta activada exitosamente',
        user: {
          id: 1,
          name: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'john.doe',
          phone: '+573001234567',
          status: true,
          role: { id: 2, name: 'Client' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Código de verificación inválido o expirado',
  })
  @ApiResponse({
    status: 409,
    description: 'Esta cuenta ya ha sido verificada',
  })
  async verifyEmail(@Query('code') code: string) {
    return this.authService.verifyEmail(code);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          name: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'john.doe',
          phone: '+573001234567',
          identification: '1234567890',
          address: 'Calle 123 #45-67',
          city: 'Bogotá',
          state: 'Cundinamarca',
          zipCode: '110111',
          imageProfileUrl: 'https://example.com/profile.jpg',
          birtDate: '1990-01-15T00:00:00.000Z',
          father: null,
          side: 1,
          status: true,
          termsConditions: true,
          role: { id: 1, name: 'Admin' },
          country: { id: 1, name: 'Colombia' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con Google' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión con Google exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de Google inválido o cuenta no verificada',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un usuario registrado con ese correo',
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Post('google/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar usuario con Google' })
  @ApiBody({ type: GoogleRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registro con Google exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de Google inválido o cuenta no verificada',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario, teléfono o email duplicado',
  })
  async googleRegister(@Body() googleRegisterDto: GoogleRegisterDto) {
    return this.authService.googleRegister(googleRegisterDto);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar código para restablecer contraseña',
    description:
      'Envía un código de seguridad al email del usuario para restablecer su contraseña. El código expira en 1 hora.',
  })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Código de reseteo enviado al email (si existe en el sistema)',
    schema: {
      example: {
        message:
          'Si el email existe, recibirás un código para restablecer tu contraseña',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Cuenta no activa' })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña con código de seguridad',
    description:
      'Restablece la contraseña del usuario utilizando el código de seguridad recibido por email.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: { example: { message: 'Contraseña restablecida exitosamente' } },
  })
  @ApiResponse({ status: 401, description: 'Código expirado' })
  @ApiResponse({ status: 404, description: 'Código inválido' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
