import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { NextClaimTimeService } from './next-claim-time.service';
import { CreateNextClaimTimeDto } from './dto/create-next-claim-time.dto';
import { UpdateNextClaimTimeDto } from './dto/update-next-claim-time.dto';
import { Request } from 'express';

@Controller('auth/next-claim-time')
export class NextClaimTimeController {
  constructor(private readonly nextClaimTimeService: NextClaimTimeService) {}

  @Post()
  create(@Body() createNextClaimTimeDto: CreateNextClaimTimeDto) {
    return this.nextClaimTimeService.create(createNextClaimTimeDto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    return await this.nextClaimTimeService.findAll(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nextClaimTimeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNextClaimTimeDto: UpdateNextClaimTimeDto,
  ) {
    return this.nextClaimTimeService.update(+id, updateNextClaimTimeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nextClaimTimeService.remove(+id);
  }
}
