/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Adam Goodman
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Query,
  Req,
} from '@nestjs/common';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UpdateUserActivityDto } from './dto/update-user-activity.dto';
import { User } from '../../entity/user';
import { getRepository } from 'typeorm';
import { PetInteraction } from '../../entity/pet-interaction';
import { QuestHistory } from '../../entity/quest-history';
import { Environment } from '../../environment';
import { GoldTransaction } from '../../entity/gold-transaction';
import { Request } from 'express';

@Injectable()
export class UserActivityService {
  create(createUserActivityDto: CreateUserActivityDto) {
    return 'This action adds a new userActivity';
  }

  async findAll(@Query() query, @Req() req: Request) {
    // Pagination
    let limit: number = query.limit ? parseInt(query.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      limit = 10;
    }
    if (limit > 500) {
      limit = 10;
    }

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
      relations: [
        'quest_history',
        'quest_history.quest',
        'pet_interactions',
        'pet_interactions.pet_item',
        'pet_interactions.coolpet',
      ],
    });
    if (!user) {
      throw new NotFoundException(
        `user with address: ${(req as any).ethAddress} not found.`,
      );
    }

    const onlyInteractions: boolean = query.onlyInteractions;

    const interactions: PetInteraction[] = user.pet_interactions;
    const activity = [];
    for (let i = interactions.length - 1; i >= 0; i--) {
      const interaction = interactions[i];
      activity.push({
        type: `petInteraction`,
        account: user.account,
        item: interaction.pet_item.name,
        itemTokenId: interaction.pet_item.item_id,
        coolpetTokenId: interaction.coolpet.token_id,
        timestamp: Date.parse(interaction.timestamp),
      });
    }

    if (!onlyInteractions) {
      const questHistory: QuestHistory[] = user.quest_history;

      for (let j = questHistory.length - 1; j >= 0; j--) {
        const history = questHistory[j];
        activity.push({
          type: `quest`,
          title: history.quest.title,
          icon: `${Environment.env.METADATA_PATH}${history.quest.icon}`,
          timestamp: Date.parse(history.timestamp),
        });
      }

      const goldClaims: GoldTransaction[] =
        await getRepository<GoldTransaction>(GoldTransaction).find({
          where: {
            account: (req as any).ethAddress,
          },
          take: limit,
        });

      for (let j = goldClaims.length - 1; j >= 0; j--) {
        const claim = goldClaims[j];
        activity.push({
          type: `goldClaim`,
          account: claim.account,
          goldClaimed: claim.amount,
          timestamp: Date.parse(claim.timestamp),
        });
      }
    }

    const data = activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return { data };
  }

  findOne(id: number) {
    return `This action returns a #${id} userActivity`;
  }

  update(id: number, updateUserActivityDto: UpdateUserActivityDto) {
    return `This action updates a #${id} userActivity`;
  }

  remove(id: number) {
    return `This action removes a #${id} userActivity`;
  }
}
