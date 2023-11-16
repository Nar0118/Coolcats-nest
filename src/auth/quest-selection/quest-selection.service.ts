import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateQuestSelectionDto } from './dto/create-quest-selection.dto';
import { UpdateQuestSelectionDto } from './dto/update-quest-selection.dto';
import { getRepository } from 'typeorm';
import { QuestSelection } from '../../entity/quest-selection';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { QuestTheme } from '../../entity/quest-theme';
import { Status } from '../../entity/quest-theme';
import { QuestIo } from '../../entity/quest-io';
import { Environment } from '../../environment';
import { ethers } from 'ethers';
import { Util } from '../../util';

@Injectable()
export class QuestSelectionService {
  create(createQuestSelectionDto: CreateQuestSelectionDto) {
    return 'This action adds a new questSelection';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `questSelection-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const selectionRepo = getRepository<QuestSelection>(QuestSelection);
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

    if (query.owner) {
      const options: FindManyOptions<QuestSelection> = {
        take: limit,
        skip: skip,
        relations: ['user'],
        where: {
          user: { account: query.owner },
        },
      };

      const [selections, total] = await selectionRepo.findAndCount(options);

      const data = [];
      for (let i = 0; i < selections.length; i++) {
        const quests = JSON.parse(selections[i].quests);
        const expanded = [];

        for (let j = 0; j < quests.length; j++) {
          const elementId = parseInt(quests[j].element);
          let element;
          switch (elementId) {
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

          const questId = parseInt(quests[j].questId);
          const ioId = parseInt(quests[j].ioId);

          const questTheme = await getRepository<QuestTheme>(
            QuestTheme,
          ).findOne({
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

          const questIo = await getRepository<QuestIo>(QuestIo).findOne({
            where: {
              status: Status.ACTIVE,
              io_id: ioId,
            },
          });
          if (!questIo) {
            throw new NotFoundException(
              `Could not find quest io for ioId ${ioId}`,
            );
          }

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

          expanded.push({
            ...questTheme,
            ...questIo,
            element: element,
          });
        }
        data.push(expanded);
      }

      const reRollCost = ethers.utils.formatEther(
        await Util.getQuestReRollCost(),
      );
      const toRet = {
        total,
        reRollCost,
        data,
      };

      // Cache our page for 2 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 2000);

      return toRet;
    } else {
      throw new BadRequestException(`No owner account provided`);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} questSelection`;
  }

  update(id: number, updateQuestSelectionDto: UpdateQuestSelectionDto) {
    return `This action updates a #${id} questSelection`;
  }

  remove(id: number) {
    return `This action removes a #${id} questSelection`;
  }
}
