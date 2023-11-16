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
  Query,
  Req,
} from '@nestjs/common';
import { CalculateAdventureClaimService } from './calculate-adventure-claim.service';
import { CreateCalculateAdventureClaimDto } from './dto/create-calculate-adventure-claim.dto';
import { UpdateCalculateAdventureClaimDto } from './dto/update-calculate-adventure-claim.dto';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/calculate-adventure-claim')
export class CalculateAdventureClaimController {
  constructor(
    private readonly calculateAdventureClaimService: CalculateAdventureClaimService,
  ) {}

  @Post()
  create(
    @Body() createCalculateAdventureClaimDto: CreateCalculateAdventureClaimDto,
  ) {
    return this.calculateAdventureClaimService.create(
      createCalculateAdventureClaimDto,
    );
  }

  @Get()
  async findAll(@Req() req, @Query() query) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.CALCULATE_ADVENTURE_CLAIM,
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
      return await this.calculateAdventureClaimService.findAll(req, query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calculateAdventureClaimService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCalculateAdventureClaimDto: UpdateCalculateAdventureClaimDto,
  ) {
    return this.calculateAdventureClaimService.update(
      +id,
      updateCalculateAdventureClaimDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calculateAdventureClaimService.remove(+id);
  }
}
