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
import { CreateQuestIoDto } from './dto/create-quest-io.dto';
import { UpdateQuestIoDto } from './dto/update-quest-io.dto';
import { getRepository, In } from 'typeorm';
import { Status } from '../../entity/quest-theme';
import { QuestIo } from '../../entity/quest-io';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { ethers } from 'ethers';
import { Util } from '../../util';

@Injectable()
export class QuestIoService {
  create(createQuestIoDto: CreateQuestIoDto) {
    return 'This action adds a new questIo';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `questIo-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    // Validate our ioIds parameter
    let ioIds: number[];
    if (query.ioIds) {
      const asArray: any[] = query.ioIds.split(',');
      ioIds = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || asInt < 0) {
          throw new BadRequestException(
            `Parameter ioIds must be set to one or more comma separated quest I/O IDs`,
          );
        }
        return asInt;
      });
    } else {
      throw new BadRequestException(
        'Parameter ioIds must be set to one or more comma separated quest I/O IDs',
      );
    }

    const questIoRepo = getRepository<QuestIo>(QuestIo);
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

      const options: FindManyOptions<QuestIo> = {
        take: limit,
        skip: skip,
      };

      const [questIos, total] = await questIoRepo.findAndCount({
        where: {
          io_id: In(ioIds),
          status: Status.ACTIVE,
        },
      });

      // Reformat output object
      questIos.forEach((questIo) => {
        questIo.gold_requirement = parseInt(
          ethers.utils.formatUnits(questIo.gold_requirement, 'gwei'),
        );
        questIo.min_gold = parseInt(
          ethers.utils.formatUnits(questIo.min_gold, 'gwei'),
        );
        questIo.max_gold = parseInt(
          ethers.utils.formatUnits(questIo.max_gold, 'gwei'),
        );

        delete questIo.id;
        delete questIo.status;
      });

      const toRet = {
        total,
        data: questIos,
      };

      // Cache our page for 60 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 60000);

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
    const qSig = `questIo-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    try {
      const questIo = await getRepository<QuestIo>(QuestIo).findOne({
        where: {
          status: Status.ACTIVE,
          io_id: id,
        },
      });
      if (!questIo) {
        throw new NotFoundException(`Could not find quest io for ioId ${id}`);
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

      // Cache our page for 30 seconds
      await Util.redisSet(qSig, JSON.stringify(questIo), 30000);

      return questIo;
    } catch (error) {
      const errorMessage: string =
        error && error.message ? error.message : 'Unknown Error';
      console.log(error);
      throw new BadRequestException(errorMessage);
    }
  }

  update(id: number, updateQuestIoDto: UpdateQuestIoDto) {
    return `This action updates a #${id} questIo`;
  }

  remove(id: number) {
    return `This action removes a #${id} questIo`;
  }
}
