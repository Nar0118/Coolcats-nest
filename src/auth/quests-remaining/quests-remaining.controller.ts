import {
  BadRequestException,
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
import { QuestsRemainingService } from './quests-remaining.service';
import { CreateQuestsRemainingDto } from './dto/create-quests-remaining.dto';
import { UpdateQuestsRemainingDto } from './dto/update-quests-remaining.dto';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

class QuestsRemainingDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  limit: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  page: string;

  @IsOptional()
  @IsEthereumAddress()
  @Type(() => String)
  owner: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  ids: string;
}

@Controller('auth/quests-remaining')
export class QuestsRemainingController {
  constructor(
    private readonly questsRemainingService: QuestsRemainingService,
  ) {}

  @Post()
  create(@Body() createQuestsRemainingDto: CreateQuestsRemainingDto) {
    return this.questsRemainingService.create(createQuestsRemainingDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: QuestsRemainingDto, @Req() req: Request) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }
    await Util.mustHavePetOrCat((req as any).ethAddress);

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUESTS_REMAINING,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.questsRemainingService.findAll(query, req);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.questsRemainingService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestsRemainingDto: UpdateQuestsRemainingDto,
  ) {
    return this.questsRemainingService.update(+id, updateQuestsRemainingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questsRemainingService.remove(+id);
  }
}
