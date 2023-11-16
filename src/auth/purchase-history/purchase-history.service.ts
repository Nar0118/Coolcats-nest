import { Injectable, Query, Req } from '@nestjs/common';
import { ActionHistory } from 'src/entity/action-history';
import { Util } from 'src/util';
import { FindManyOptions, getRepository } from 'typeorm';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class PurchaseHistoryService {
  async findAll(@Query() query, @Req() req: Request) {
    let qSig: string = Util.querySignature(query);
    qSig = `purchasHistory-findAll${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    let limit: number = query.limit ? parseInt(query.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      limit = 10;
    }
    let page: number = query.page ? parseInt(query.page) : 1;
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    const skip = (page - 1) * limit;

    const options: FindManyOptions<ActionHistory> = {
      take: limit,
      skip: skip,
      relations: ['action', 'user'],
      where: {
        ...(query.actionKey && {
          action: {
            actionKey: query.actionKey
          }
        }),
        ...(query.address && {
          user: {
            account: query.address
          }
        }),
      }
    };

    const actionHistoryRepo = getRepository<ActionHistory>(ActionHistory);
    const [actionHistory, total] = await actionHistoryRepo.findAndCount(
      options,
    );

    actionHistory.forEach((action) => {
      delete action.id;
      delete action.guid;
      delete action.created_at;
      delete action.updated_at;
      delete action.status;
      delete action.discord_id;
      delete action.twitter_id;

      delete action.action;
      delete action.user;

      (action as any).address = (req as any).ethAddress;
    });

    await Util.redisSet(qSig, JSON.stringify(actionHistory), 30000);
    return {
      total,
      data: actionHistory,
      limit,
    };
  }
}
