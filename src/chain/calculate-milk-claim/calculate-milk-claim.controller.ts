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
} from '@nestjs/common';
import { CalculateMilkClaimService } from './calculate-milk-claim.service';
import { CreateCalculateMilkClaimDto } from './dto/create-calculate-milk-claim.dto';
import { UpdateCalculateMilkClaimDto } from './dto/update-calculate-milk-claim.dto';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/calculate-milk-claim')
export class CalculateMilkClaimController {
  constructor(
    private readonly calculateMilkClaimService: CalculateMilkClaimService,
  ) {}

  @Post()
  create(@Body() createCalculateMilkClaimDto: CreateCalculateMilkClaimDto) {
    return this.calculateMilkClaimService.create(createCalculateMilkClaimDto);
  }

  @Get()
  async findAll(@Req() req, @Query() query) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.CALCULATE_MILK_CLAIM,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      const chainRateLimited: IRateLimitRule = await Util.rateLimitChainCalls(
        (req as any).ethAddress,
      );
      if (chainRateLimited) {
        const maxFreqiuencySecs: number = Math.floor(
          chainRateLimited.windowSecs / 3600,
        );
        throw new HttpException(
          `You can only make ${chainRateLimited.maxHits} blockchain calls every ${maxFreqiuencySecs} hours.`,
          429,
        );
      }
      return await this.calculateMilkClaimService.findAll(req, query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calculateMilkClaimService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCalculateMilkClaimDto: UpdateCalculateMilkClaimDto,
  ) {
    return this.calculateMilkClaimService.update(
      +id,
      updateCalculateMilkClaimDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calculateMilkClaimService.remove(+id);
  }
}
