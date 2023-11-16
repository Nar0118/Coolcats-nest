/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateQuestThemeDto } from './dto/create-quest-theme.dto';
import { UpdateQuestThemeDto } from './dto/update-quest-theme.dto';
import { getRepository, In } from 'typeorm';
import { QuestTheme, Status } from '../../entity/quest-theme';
import { Environment } from '../../environment';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Util } from '../../util';

@Injectable()
export class QuestThemeService {
  create(createQuestThemeDto: CreateQuestThemeDto) {
    return 'This action adds a new questTheme';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `questTheme-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    // Validate our questIds parameter
    let questIds: number[];
    if (query.questIds) {
      const asArray: any[] = query.questIds.split(',');
      questIds = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || asInt < 0) {
          throw new BadRequestException(
            `Parameter questIds must be set to one or more comma separated quest IDs`,
          );
        }
        return asInt;
      });
    } else {
      throw new BadRequestException(
        'Parameter questIds must be set to one or more comma separated quest IDs',
      );
    }

    const questThemeRepo = getRepository<QuestTheme>(QuestTheme);
    try {
      // Pagination
      let limit: number = query.limit ? parseInt(query.limit) : 10;
      if (isNaN(limit) || limit <= 0) {
        limit = 10;
      }
      let page: number = query.page ? parseInt(query.page) : 1;
      if (isNaN(page) || page < 1) {
        page = 1;
      }
      const skip = (page - 1) * limit;

      const options: FindManyOptions<QuestTheme> = {
        take: limit,
        skip: skip,
      };

      // Grab our questTheme for the given ids
      const [questThemes, total] = await questThemeRepo.findAndCount({
        where: {
          quest_id: In(questIds),
          status: Status.ACTIVE,
        },
      });

      // Reformat the return object
      questThemes.forEach((questTheme) => {
        questTheme.icon = `${Environment.env.METADATA_PATH}${questTheme.icon}`;
        delete questTheme.id;
        delete questTheme.status;
      });

      const toRet = {
        total,
        data: questThemes,
      };

      // Cache our page for 5 minutes
      await Util.redisSet(qSig, JSON.stringify(toRet), 300000);

      return toRet;
    } catch (error) {
      const errorMessage: string =
        error && error.message ? error.message : 'Unknown Error';
      console.log(error);
      throw new BadRequestException(errorMessage);
    }
  }

  async findOne(id: number) {
    // Page caching
    const qSig = `questTheme-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    try {
      const questId = id;

      const questTheme = await getRepository<QuestTheme>(QuestTheme).findOne({
        where: {
          status: Status.ACTIVE,
          quest_id: questId,
        },
      });
      if (!questTheme) {
        throw new NotFoundException(
          `Could not find quest theme for questId ${questId}`,
        );
      }

      questTheme.icon = `${Environment.env.METADATA_PATH}${questTheme.icon}`;

      delete questTheme.id;
      delete questTheme.status;

      const toRet = {
        questTheme,
      };

      // Cache our page for 5 minutes
      await Util.redisSet(qSig, JSON.stringify(toRet), 300000);

      return toRet;
    } catch (error) {
      const errorMessage: string =
        error && error.message ? error.message : 'Unknown Error';
      console.log(error);
      throw new BadRequestException(errorMessage);
    }
  }

  update(id: number, updateQuestThemeDto: UpdateQuestThemeDto) {
    return `This action updates a #${id} questTheme`;
  }

  remove(id: number) {
    return `This action removes a #${id} questTheme`;
  }
}
