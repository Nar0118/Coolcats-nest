import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { StakePetService } from './stake-pet.service';
import { CreateStakePetDto } from './dto/create-stake-pet.dto';
import { UpdateStakePetDto } from './dto/update-stake-pet.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/stake-pet')
export class StakePetController {
  constructor(private readonly stakePetService: StakePetService) {}

  @Post()
  async create(
    @Body() createStakePetDto: CreateStakePetDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.STAKE_PET,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      const chainRateLimited: IRateLimitRule = await Util.rateLimitChainCalls(
        (req as any).ethAddress,
      );
      if (chainRateLimited) {
        const maxFrequencySecs: number = Math.floor(
          chainRateLimited.windowSecs / 3600,
        );

        throw new HttpException(
          {
            message: `You can only make ${
              chainRateLimited.maxHits
            } blockchain calls every ${maxFrequencySecs} hour${
              maxFrequencySecs > 1 ? 's' : ''
            }.`,
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            rule: JSON.stringify(chainRateLimited),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return this.stakePetService.create(createStakePetDto, req);
    }
  }

  @Get()
  findAll() {
    return this.stakePetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stakePetService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStakePetDto: UpdateStakePetDto,
  ) {
    return this.stakePetService.update(+id, updateStakePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stakePetService.remove(+id);
  }
}
