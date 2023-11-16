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
import { UserActivityService } from './user-activity.service';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UpdateUserActivityDto } from './dto/update-user-activity.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

class UserActivityDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  limit: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  onlyInteractions: boolean;
}

@Controller('auth/user-activity')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Post()
  create(@Body() createUserActivityDto: CreateUserActivityDto) {
    return this.userActivityService.create(createUserActivityDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: UserActivityDto, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_ACTIVITY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.userActivityService.findAll(query, req);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userActivityService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserActivityDto: UpdateUserActivityDto,
  ) {
    return this.userActivityService.update(+id, updateUserActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userActivityService.remove(+id);
  }
}
