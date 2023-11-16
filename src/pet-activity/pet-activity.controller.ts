import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PetActivityService } from './pet-activity.service';
import { CreatePetActivityDto } from './dto/create-pet-activity.dto';
import { UpdatePetActivityDto } from './dto/update-pet-activity.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IRateLimitRule, Util } from '../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../utility/enums';

export class PetActivityDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  limit: string;

  @IsString()
  @Type(() => String)
  petTokenId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  onlyInteractions: boolean;
}

@Controller('pet-activity')
export class PetActivityController {
  constructor(private readonly petActivityService: PetActivityService) {}

  @Post()
  create(@Body() createPetActivityDto: CreatePetActivityDto) {
    return this.petActivityService.create(createPetActivityDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: PetActivityDto, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.PET_ACTIVITY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.petActivityService.findAll(query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petActivityService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePetActivityDto: UpdatePetActivityDto,
  ) {
    return this.petActivityService.update(+id, updatePetActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petActivityService.remove(+id);
  }
}
