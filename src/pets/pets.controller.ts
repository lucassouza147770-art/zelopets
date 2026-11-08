import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsService } from './pets.service';

@Controller('pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  findMine(@Req() request: { user: { tutorId: string } }) {
    return this.petsService.findByTutor(request.user.tutorId);
  }

  @Get(':id')
  findOne(@Req() request: { user: { tutorId: string } }, @Param('id') id: string) {
    return this.petsService.findOne(request.user.tutorId, id);
  }

  @Post()
  create(@Req() request: { user: { tutorId: string } }, @Body() dto: CreatePetDto) {
    return this.petsService.create(request.user.tutorId, dto);
  }

  @Patch(':id')
  update(
    @Req() request: { user: { tutorId: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petsService.update(request.user.tutorId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: { user: { tutorId: string } }, @Param('id') id: string) {
    return this.petsService.remove(request.user.tutorId, id);
  }
}
