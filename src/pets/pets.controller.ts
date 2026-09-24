import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';
import { PetsService } from './pets.service';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  findMine(@Req() request: { user: { tutorId: string } }) {
    return this.petsService.findByTutor(request.user.tutorId);
  }

  @Post()
  create(@Req() request: { user: { tutorId: string } }, @Body() dto: CreatePetDto) {
    return this.petsService.create(request.user.tutorId, dto);
  }
}
