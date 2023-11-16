import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateQuestHistoryDto } from './dto/create-quest-history.dto';
import { UpdateQuestHistoryDto } from './dto/update-quest-history.dto';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { QuestHistory } from '../../entity/quest-history';
import { getRepository } from 'typeorm';
import { Environment } from '../../environment';
import { ethers } from 'ethers';
import { Util } from '../../util';

@Injectable()
export class QuestHistoryService {
  create(createQuestHistoryDto: CreateQuestHistoryDto) {
    return 'This action adds a new questHistory';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `questHistory-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    // Make sure we have an owner parameter
    if (!query?.owner) {
      throw new BadRequestException("Please specify the 'owner' parameter");
    }

    const historyRepo = getRepository<QuestHistory>(QuestHistory);
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

      const options: FindManyOptions<QuestHistory> = {
        take: limit,
        skip: skip,
        relations: ['user', 'quest', 'io', 'coolpet'],
        where: {
          user: { account: query.owner },
        },
      };

      const [history, total] = await historyRepo.findAndCount(options);

      const data = [];
      for (let i = 0; i < history.length; i++) {
        const quest = history[i];

        let element;
        switch (quest.element) {
          case 0:
            element = 'none';
            break;
          case 1:
            element = 'grass';
            break;
          case 2:
            element = 'air';
            break;
          case 3:
            element = 'fire';
            break;
          case 4:
            element = 'water';
            break;
          default:
            element = 'none';
            break;
        }

        quest.total_milk_reward = ethers.utils.formatUnits(
          quest.total_milk_reward,
        );

        const questTheme = quest.quest;

        questTheme.icon = `${Environment.env.METADATA_PATH}${questTheme.icon}`;

        delete questTheme.id;
        delete questTheme.status;

        const questIo = quest.io;

        delete questIo.id;
        delete questIo.status;

        questIo.gold_requirement = parseInt(
          ethers.utils.formatUnits(questIo.gold_requirement, 'gwei'),
        );
        questIo.min_gold = parseInt(
          ethers.utils.formatUnits(questIo.min_gold, 'gwei'),
        );
        questIo.max_gold = parseInt(
          ethers.utils.formatUnits(questIo.max_gold, 'gwei'),
        );

        const pet = quest.coolpet;

        data.push({
          petTokenId: pet.token_id,
          element,
          goldAward: quest.total_milk_reward,
          timestamp: quest.timestamp,
          ...questTheme,
          ...questIo,
        });
      }

      const toRet = {
        total,
        data,
      };

      // Cache our page for 5 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

      return toRet;
    } catch (error) {
      const errorMessage: string =
        error && error.message ? error.message : 'Unknown Error';
      console.log(error);
      throw new BadRequestException(errorMessage);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} questHistory`;
  }

  update(id: number, updateQuestHistoryDto: UpdateQuestHistoryDto) {
    return `This action updates a #${id} questHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} questHistory`;
  }
}
