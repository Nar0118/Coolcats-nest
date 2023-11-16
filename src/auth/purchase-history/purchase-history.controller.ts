import { Controller, Get, HttpException, Query, Req } from '@nestjs/common';
import { PurchaseHistoryService } from './purchase-history.service';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';
import { Request } from 'express';

@Controller('auth/purchase-history')
export class PurchaseHistoryController {
  constructor(
    private readonly PurchaseHistoryService: PurchaseHistoryService,
  ) { }
  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.PURCHASE_HISTORY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.PurchaseHistoryService.findAll(
        query,
        req,
      );
    }
  }
}
