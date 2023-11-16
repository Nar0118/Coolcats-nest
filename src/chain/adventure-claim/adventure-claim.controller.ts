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
import { AdventureClaimService } from './adventure-claim.service';
import { CreateAdventureClaimDto } from './dto/create-adventure-claim.dto';
import { UpdateAdventureClaimDto } from './dto/update-adventure-claim.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/adventure-claim')
export class AdventureClaimController {
  constructor(private readonly adventureClaimService: AdventureClaimService) {}

  @Post()
  async create(
    @Body() createAdventureClaimDto: CreateAdventureClaimDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.ADVENTURE_CLAIM,
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
      return this.adventureClaimService.create(createAdventureClaimDto, req);
    }
  }

  @Get()
  findAll() {
    return this.adventureClaimService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adventureClaimService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdventureClaimDto: UpdateAdventureClaimDto,
  ) {
    return this.adventureClaimService.update(+id, updateAdventureClaimDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adventureClaimService.remove(+id);
  }
}
