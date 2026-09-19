import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const tutorExistente = await this.prisma.tutor.findUnique({
      where: { email: dto.email },
    });

    if (tutorExistente) {
      throw new ConflictException('Já existe um tutor com esse e-mail');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const tutor = await this.prisma.tutor.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
      },
    });

    return this.gerarToken(tutor.id, tutor.email);
  }

  async login(dto: LoginDto) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { email: dto.email },
    });

    if (!tutor) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(dto.senha, tutor.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.gerarToken(tutor.id, tutor.email);
  }

  private gerarToken(tutorId: string, email: string) {
    return {
      accessToken: this.jwtService.sign({ sub: tutorId, email }),
    };
  }
}
