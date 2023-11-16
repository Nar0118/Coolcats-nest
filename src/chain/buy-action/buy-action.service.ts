/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBuyActionDto } from './dto/create-buy-action.dto';
import { UpdateBuyActionDto } from './dto/update-buy-action.dto';
import { Util } from '../../util';
import { Request } from 'express';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from 'typeorm';
import { Action } from '../../entity/action';
import { ActionStatus, Status, TokenType } from 'src/utility/enums';
import { ActionHistory } from 'src/entity/action-history';
import { User } from 'src/entity/user';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class BuyActionService {
  async create(createBuyActionDto: CreateBuyActionDto, req: Request) {
    /**
     * Make sure service is available
     */
    const ethAddress = (req as any).ethAddress;
    const serviceUnavailable: boolean = await Util.serviceUnavailable(
      ethAddress,
    );
    if (serviceUnavailable) {
      throw new BadRequestException(
        'Service is temporarily unavailable, please try again later',
      );
    }

    await Util.mustHavePetOrCat(ethAddress);

    // Validate and convert post parameter to integer
    const tokenId = createBuyActionDto.token_id
      ? parseInt(createBuyActionDto.token_id)
      : undefined;
    if (createBuyActionDto.token_id) {
      if (Number.isNaN(tokenId)) {
        throw new BadRequestException(`Invalid token_id parameter`);
      }
      if (!Number.isInteger(tokenId)) {
        throw new BadRequestException(
          `Token Id ${createBuyActionDto.token_id} must be an integer`,
        );
      }
    }

    const userRepo = getRepository<User>(User);
    const actionRepo = getRepository<Action>(Action);
    const actionHistoryRepo = getRepository<ActionHistory>(ActionHistory);

    const actionKey = createBuyActionDto.actionKey;
    const action = await actionRepo.findOne({
      where: {
        actionKey: actionKey,
        status: Status.ACTIVE,
      },
      relations: ['action_history'],
    });
    if (!action) {
      throw new BadRequestException(
        `Could not find active action with ${actionKey} key`,
      );
    }
    if (action.limit && action.limit != 0 && action.limit <= action.action_history.length) {
      throw new BadRequestException(
        `Action with ${actionKey} key is already sold out`,
      );
    }

    const user = await userRepo.findOne({
      where: {
        account: ethAddress,
      },
    });
    if (!user) {
      throw new NotFoundException(
        ` Could not find user for address: ${ethAddress}`,
      );
    }

    const actionPrice: number = parseInt(action.price);

    // Grab user's gold balance
    const goldBalance: string = await Util.goldBalance(ethAddress);

    if (parseInt(goldBalance) < actionPrice) {
      throw new BadRequestException(
        `Total purchase price of ${actionPrice} exceeds gold balance for user ${ethAddress}`,
      );
    }

    switch (action.tokenType) {
      case TokenType.NONE:
        break;
      case TokenType.CAT:
        if (!createBuyActionDto.token_id) {
          throw new BadRequestException(
            'Token ID is required for Cool Cat token type',
          );
        }
        const catOwner = await Util.doesUserOwnToken(
          'COOLCAT_721',
          tokenId,
          ethAddress,
        );
        if (!catOwner) {
          throw new BadRequestException(
            `User ${ethAddress} does not own Cat with token id ${tokenId}`,
          );
        }
        break;
      case TokenType.PET:
        if (!createBuyActionDto.token_id) {
          throw new BadRequestException(
            'Token ID is required for Cool Pet token type',
          );
        }
        const petOwner = await Util.doesUserOwnToken(
          'COOLPET_721',
          tokenId,
          ethAddress,
        );
        if (!petOwner) {
          throw new BadRequestException(
            `User ${ethAddress} does not own Pet with token id ${tokenId}`,
          );
        }
        break;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // IF WE GET HERE, THE USER HAS ENOUGH GOLD TO PURCHASE THE ACTION, SO FEED IT OVER TO THE WORKER SERVICE TO COMPLETE
    // ---------------------------------------------------------------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    const actionHistory = new ActionHistory();

    actionHistory.action = action;
    actionHistory.status = ActionStatus.SENT;
    actionHistory.user = user;
    actionHistory.guid = guid;
    actionHistory.type = createBuyActionDto.type ? createBuyActionDto.type : '';
    actionHistory.token_id = createBuyActionDto.token_id
      ? createBuyActionDto.token_id
      : '';
    actionHistory.discord_id = createBuyActionDto.discord_id
      ? createBuyActionDto.discord_id
      : '';
    actionHistory.twitter_id = createBuyActionDto.twitter_id
      ? createBuyActionDto.twitter_id
      : '';
    actionHistory.details = createBuyActionDto.details
      ? createBuyActionDto.details
      : '';

    await actionHistoryRepo.save<ActionHistory>(actionHistory);

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'BUY_ACTION',
        guid,
        address: ethAddress,
        actionKey,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `BuyAction`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }
}
