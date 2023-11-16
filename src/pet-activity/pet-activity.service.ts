import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreatePetActivityDto } from './dto/create-pet-activity.dto';
import { UpdatePetActivityDto } from './dto/update-pet-activity.dto';
import { getRepository } from 'typeorm';
import { QuestHistory } from '../entity/quest-history';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { PetInteraction } from '../entity/pet-interaction';
import { Coolpets } from '../entity/coolpets';
import { Environment } from '../environment';

@Injectable()
export class PetActivityService {
  create(createPetActivityDto: CreatePetActivityDto) {
    return 'This action adds a new petActivity';
  }

  async findAll(@Query() query) {
    // Pagination
    let limit: number = query.limit ? parseInt(query.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      limit = 10;
    }
    if (limit > 500) {
      limit = 10;
    }

    if (!query.petTokenId || isNaN(parseInt(query.petTokenId))) {
      throw new BadRequestException(`Please provide a petTokenId`);
    }

    // Find our cool pet
    const tokenId = parseInt(query.petTokenId);
    const coolpet = await getRepository<Coolpets>(Coolpets).findOne({
      where: {
        token_id: tokenId,
      },
      relations: [
        'quest_history',
        'quest_history.quest',
        'pet_interactions',
        'pet_interactions.pet_item',
      ],
    });
    if (!coolpet) {
      throw new BadRequestException(`Pet with ID: ${tokenId} does not exist.`);
    }

    const onlyInteractions: boolean = query.onlyInteractions;

    // const interactionOptions: FindManyOptions<PetInteraction> = {
    //   take: limit,
    //   where: {
    //     coolpet: coolpet,
    //   },
    //   relations: ['pet_item']
    // };
    // const interactionRepo = getRepository<PetInteraction>(PetInteraction);

    const interactions: PetInteraction[] = coolpet.pet_interactions;

    const activity = [];
    for (let i = interactions.length - 1; i >= 0; i--) {
      const interaction = interactions[i];
      activity.push({
        type: `petInteraction`,
        item: interaction.pet_item.name,
        itemTokenId: interaction.pet_item.item_id,
        timestamp: Date.parse(interaction.timestamp),
      });
    }

    if (!onlyInteractions) {
      // Get quest activity
      // const questHistoryRepo = getRepository<QuestHistory>(QuestHistory);
      // const historyOptions: FindManyOptions<QuestHistory> = {
      //   take: limit,
      //   where: {
      //     coolpet: coolpet,
      //   },
      //   relations: ['quest']
      // };

      const questHistory: QuestHistory[] = coolpet.quest_history;

      for (let j = questHistory.length - 1; j >= 0; j--) {
        const history = questHistory[j];
        activity.push({
          type: `quest`,
          title: history.quest.title,
          icon: `${Environment.env.METADATA_PATH}${history.quest.icon}`,
          timestamp: Date.parse(history.timestamp),
        });
      }
    }

    const data = activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return { data };
  }

  findOne(id: number) {
    return `This action returns a #${id} petActivity`;
  }

  update(id: number, updatePetActivityDto: UpdatePetActivityDto) {
    return `This action updates a #${id} petActivity`;
  }

  remove(id: number) {
    return `This action removes a #${id} petActivity`;
  }
}
