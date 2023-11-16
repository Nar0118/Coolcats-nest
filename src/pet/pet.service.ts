/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { getRepository, In } from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { CoolcatOwner } from '../entity/coolcat-owner';
import { DatabaseService } from '../database.service';
import { Coolpets } from '../entity/coolpets';
import { BlockchainContract } from '../entity/blockchain-contract';
import { Environment } from '../environment';
import { StakedPet } from '../entity/staked-pet';
import { ethers } from 'ethers';
import { Util } from '../util';
import { PetInteraction } from '../entity/pet-interaction';
import { PetItem } from '../entity/pet-item';
import { ERedisKey } from '../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class PetService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createPetDto: CreatePetDto) {
    return 'This action adds a new pet';
  }

  async findAll(query: any) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `pet${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

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

      // Parse owner
      const owner: string = query.owner ? query.owner : undefined;

      // Figure out our options
      const options: FindManyOptions<Coolpets> = {
        take: limit,
        skip: skip,
        relations: ['quest_history'],
      };

      // TODO
      // Need to prevent filtering by hat, face, chest, arm, body, or back if
      // element is NULL because we haven't formed yet (still in egg, blob1, or blob2 stage)

      // Filter according to traits
      if (
        query.hat ||
        query.face ||
        query.chest ||
        query.arm ||
        query.body ||
        query.back ||
        query.element ||
        query.stage ||
        query.ids
      ) {
        options.where = {};
        if (query.hat) {
          options.where.hat = query.hat;
        }
        if (query.face) {
          options.where.face = query.face;
        }
        if (query.chest) {
          options.where.chest = query.chest;
        }
        if (query.arm) {
          options.where.arm = query.arm;
        }
        if (query.body) {
          options.where.body = query.body;
        }
        if (query.back) {
          options.where.back = query.back;
        }
        if (query.element) {
          options.where.element = query.element;
        }
        if (query.stage) {
          options.where.stage = query.stage;
        }
        if (query.ids) {
          const ids: number[] = query.ids.split(',');
          options.where = {
            token_id: In(ids),
          };
        }
      }

      // Sort according to specified field. Bad fields will result in 400 error
      // _desc and _asc will determine sort direction (if at the end of the string)
      // Default is ascending.
      if (query.sortBy) {
        let sortBy: string = query.sortBy;
        let dir = 'ASC';
        const underscoreLoc: number = query.sortBy.lastIndexOf('_');
        if (underscoreLoc >= 0) {
          const candidate: string = query.sortBy
            .substr(underscoreLoc + 1)
            .toUpperCase();
          if (candidate === 'DESC') {
            dir = 'DESC';
          }
          if (candidate === 'DESC' || candidate === 'ASC') {
            sortBy = query.sortBy.substring(0, underscoreLoc);
          }
        }
        options.order = {};
        options.order[sortBy] = dir;
      }

      // We may need to grab the IDs of pets owned by a particular individual
      if (query.owner) {
        if (!ethers.utils.isAddress(query.owner)) {
          throw new BadRequestException(`Invalid address ${query.owner}`);
        }

        // Grab the coolpet contract
        const coolpetBlockchainContract: BlockchainContract =
          await getRepository<BlockchainContract>(BlockchainContract).findOne({
            where: {
              code: 'COOLPET_721',
              mode: Environment.env.MODE,
            },
          });
        if (!coolpetBlockchainContract) {
          throw new BadRequestException('Could not find COOLPET_721 record');
        }

        const coolcatOwnerRepository =
          getRepository<CoolcatOwner>(CoolcatOwner);
        const ownedPets = await coolcatOwnerRepository.find({
          select: ['token_id'],
          where: {
            to: query.owner,
            blockchainContract: coolpetBlockchainContract,
          },
        });
        const coolpetTokenIds: number[] = ownedPets.map((val) => {
          return val.token_id;
        });
        if (!options.where) {
          options.where = {};
        }
        options.where['token_id'] = In(coolpetTokenIds);
      }

      // Hit the database to grab the pets !
      const [coolPets, total] = await getRepository<Coolpets>(
        Coolpets,
      ).findAndCount(options);

      // Grab staked pets as a subset of coolPets
      const tokenIds = [];
      for (let i = 0; i < coolPets.length; i++) {
        tokenIds.push(coolPets[i].token_id);
      }
      const stakedPets: StakedPet[] = await getRepository<StakedPet>(
        StakedPet,
      ).find({
        where: {
          token_id: In(tokenIds),
        },
      });

      let questWeb3ContractInstance: any;

      // Grab reset time
      let resetTime: number | string = await Util.redisGet(
        ERedisKey.QUEST_RESET_TIME,
      );
      if (!resetTime) {
        questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
        resetTime = await questWeb3ContractInstance.methods
          .getDailyResetTime()
          .call();
        await Util.redisSet(
          ERedisKey.QUEST_RESET_TIME,
          resetTime.toString(),
          60_000,
        );
      } else {
        resetTime = parseInt(resetTime);
      }

      // Grab the quests per day
      let questsPerDay: number | string = await Util.redisGet(
        ERedisKey.QUEST_PET_DAY,
      );
      if (!questsPerDay) {
        if (!questWeb3ContractInstance) {
          questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
        }
        questsPerDay = await questWeb3ContractInstance.methods
          ._questAllowance()
          .call();
        await Util.redisSet(
          ERedisKey.QUEST_PET_DAY,
          questsPerDay.toString(),
          900_000,
        );
      } else {
        questsPerDay = parseInt(questsPerDay);
      }

      // Need to prevent filtering by hat, face, chest, arm, body, or back if
      for (const val of coolPets) {
        (val as any).attributes = [
          { trait_type: 'Hat', value: val.hat },
          { trait_type: 'Face', value: val.face },
          { trait_type: 'Chest', value: val.chest },
          { trait_type: 'Arm', value: val.arm },
          { trait_type: 'Body', value: val.body },
          { trait_type: 'Back', value: val.back },
          { trait_type: 'Element', value: val.element },
        ];
        delete val.hat;
        delete val.face;
        delete val.chest;
        delete val.arm;
        delete val.body;
        delete val.back;
        delete val.element;

        if (val.stage.toLowerCase() === 'two') {
          (val as any).currentElement = await this.calculatePetElement(val);
        }

        delete val.air;
        delete val.fire;
        delete val.water;
        delete val.grass;

        delete val.id;

        (val as any).questsPerDay = questsPerDay;

        // TODO This needs to move to a separate endpoint
        // if (val.quest_history.length > 0) {
        //     const recentQuest = val.quest_history[val.quest_history.length - 1]; // .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
        //     if (!questWeb3ContractInstance) {
        //         questWeb3ContractInstance = await this.resolveQuestWeb3Contract();
        //     }
        //     const dailyCount = await questWeb3ContractInstance.methods.getDailyQuestCount(val.token_id).call();
        //     if (Date.parse(recentQuest.timestamp) / 1000 < (resetTime - 86400)) {
        //         (val as any).questsRemaining = questsPerDay;
        //     } else {
        //         (val as any).questsRemaining = questsPerDay - dailyCount;
        //     }
        // } else {
        //     (val as any).questsRemaining = questsPerDay;
        // }
        (val as any).questsRemaining = questsPerDay;

        const stakedPet: StakedPet = stakedPets.find(
          (obj) => obj.token_id == val.token_id,
        );
        (val as any).staked = stakedPet ? stakedPet.staked : false;

        delete val.quest_history;

        // TODO This needs to move to a separate endpoint
        // (val as any).itemInteractions = await Util.getPetInteractionCounts(val.token_id);
        // const percentToNextStage = await Util.getPercentageToNextStage(val.token_id);
        // if (percentToNextStage || percentToNextStage == 0) {
        //     (val as any).percentToNextStage = await Util.getPercentageToNextStage(val.token_id);
        // }
        // (val as any).percentToNextStage = 100;
      }

      const toRet: any = {
        data: coolPets,
        total: total,
        limit: limit,
      };

      // Cache our page for 5 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

      // Return our results
      return toRet;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number): Promise<any> {
    // Page caching
    const qSig = `cat-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const petRepository = getRepository<Coolpets>(Coolpets);
    const coolpet: Coolpets = await petRepository.findOne({
      where: {
        token_id: id,
      },
      relations: ['quest_history'],
    });
    if (!coolpet) {
      throw new NotFoundException(`Pet token ID ${id} not found.`);
    }

    const stakedPet: StakedPet = await getRepository<StakedPet>(
      StakedPet,
    ).findOne({
      where: {
        token_id: id,
      },
    });

    (coolpet as any).attributes = [
      { trait_type: 'Hat', value: coolpet.hat },
      { trait_type: 'Face', value: coolpet.face },
      { trait_type: 'Chest', value: coolpet.chest },
      { trait_type: 'Arm', value: coolpet.arm },
      { trait_type: 'Body', value: coolpet.body },
      { trait_type: 'Back', value: coolpet.back },
      { trait_type: 'Element', value: coolpet.element },
    ];
    delete coolpet.hat;
    delete coolpet.face;
    delete coolpet.chest;
    delete coolpet.arm;
    delete coolpet.body;
    delete coolpet.back;
    delete coolpet.element;

    if (coolpet.stage.toLowerCase() === 'two') {
      (coolpet as any).currentElement = await this.calculatePetElement(coolpet);
    }

    delete coolpet.air;
    delete coolpet.fire;
    delete coolpet.water;
    delete coolpet.grass;

    delete coolpet.id;

    let questWeb3ContractInstance: any;

    // Grab reset time
    let resetTime: number | string = await Util.redisGet(
      ERedisKey.QUEST_RESET_TIME,
    );
    if (!resetTime) {
      questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
      resetTime = await questWeb3ContractInstance.methods
        .getDailyResetTime()
        .call();
      await Util.redisSet(
        ERedisKey.QUEST_RESET_TIME,
        resetTime.toString(),
        60_000,
      );
    } else {
      resetTime = parseInt(resetTime);
    }

    // Grab the quests per day
    let questsPerDay: number | string = await Util.redisGet(
      ERedisKey.QUEST_PET_DAY,
    );
    if (!questsPerDay) {
      if (!questWeb3ContractInstance) {
        questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
      }
      questsPerDay = await questWeb3ContractInstance.methods
        ._questAllowance()
        .call();
      await Util.redisSet(
        ERedisKey.QUEST_PET_DAY,
        questsPerDay.toString(),
        900_000,
      );
    } else {
      questsPerDay = parseInt(questsPerDay);
    }

    // Tack on history
    if (coolpet.quest_history.length > 0) {
      const recentQuest =
        coolpet.quest_history[coolpet.quest_history.length - 1]; // .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
      if (!questWeb3ContractInstance) {
        questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
      }

      // Blockchain call
      let dailyCount: number | string = await Util.redisGet(
        `dailyQuestCount${coolpet.token_id}`,
      );
      if (!dailyCount) {
        if (!questWeb3ContractInstance) {
          questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
        }
        dailyCount = await questWeb3ContractInstance.methods
          .getDailyQuestCount(coolpet.token_id)
          .call();
        await Util.redisSet(
          `dailyQuestCount${coolpet.token_id}`,
          dailyCount.toString(),
          15000,
        );
      } else {
        dailyCount = parseInt(dailyCount);
      }

      if (
        Date.parse(recentQuest.timestamp) / 1000 <
        (resetTime as number) - 86400
      ) {
        (coolpet as any).questsRemaining = questsPerDay;
      } else {
        (coolpet as any).questsRemaining =
          (questsPerDay as number) - (dailyCount as number);
      }
    } else {
      (coolpet as any).questsRemaining = questsPerDay;
    }

    if (stakedPet) {
      (coolpet as any).staked = stakedPet.staked;

      if (stakedPet.staked) {
        (coolpet as any).adventureLockout = false;
      } else {
        (coolpet as any).adventureLockout =
          Date.parse(stakedPet.timestamp) / 1000 >=
          (resetTime as number) - 86400;
      }
    } else {
      (coolpet as any).staked = false;
      (coolpet as any).adventureLockout = false;
    }

    delete coolpet.quest_history;

    (coolpet as any).itemInteractions = await Util.getPetInteractionCounts(
      coolpet.token_id,
    );

    // Figure this out, not sure it works properly and perhaps the client wants it.
    // const percentToNextStage = await Util.getPercentageToNextStage(coolpet.token_id);
    // if (percentToNextStage || percentToNextStage == 0) {
    //     (coolpet as any).percentToNextStage = await Util.getPercentageToNextStage(coolpet.token_id);
    // }
    (coolpet as any).percentToNextStage = 0;

    const toRet = {
      data: coolpet,
    };

    // Cache our page for 5 seconds
    await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

    // Return our results
    return toRet;
  }

  update(id: number, updatePetDto: UpdatePetDto) {
    return `This action updates a #${id} pet`;
  }

  remove(id: number) {
    return `This action removes a #${id} pet`;
  }

  async calculatePetElement(coolpet: Coolpets) {
    // Search for the key having the highest value, const elements will be an array of 1 or more
    // element name strings from the set ('fire', 'air', 'grass' or 'water) representing the element(s)
    // with the highest value.
    const stats: any = {
      fire: coolpet.fire,
      air: coolpet.air,
      grass: coolpet.grass,
      water: coolpet.water,
    };
    const max: number = Math.max(
      stats.air,
      stats.fire,
      stats.grass,
      stats.water,
    );
    const elements: string[] = Object.keys(stats).filter((key) => {
      return stats[key] === max;
    });

    // We couuld have a tie, so if so, I need to grab all of our interactions that were applied to this
    // pet and work our way backwards. When I find an interaction that has both max traits, I can choose
    // the one that
    let element: string | undefined;
    if (elements.length > 1) {
      // We have a tie. We need to grab all of our interactions that were applied to this
      // pet and work our way backwards. When I find the first interaction that has an element value
      // from the tied list that is greater than the others, that will be the element we
      // turn this pet into

      // Need to go grab all of the interactions from the database
      const petInteractionRepo = getRepository<PetInteraction>(PetInteraction);
      const interactions: PetInteraction[] | undefined =
        await petInteractionRepo.find({
          relations: ['user', 'coolpet', 'pet_item'],
          where: {
            coolpet,
          },
          order: {
            id: 'DESC',
          },
        });
      if (!interactions) {
        throw new Error(
          `Could not find any interactions for pet id: ${coolpet.id}`,
        );
      }

      // =========================================================================================================
      // Local function that will look at a PetInteraction and return the element name from the elements array
      // passed in as a parameter that has a value greater than any other element in the elements array
      // =========================================================================================================
      const maxElementFromPetInteraction: (
        petInteraction: PetInteraction,
        elements: string[],
      ) => string | undefined = (petInteraction: PetInteraction) => {
        const petItem: PetItem = petInteraction.pet_item;
        let maxValue = 0;
        let maxElement: string | undefined;
        elements.forEach((val: string) => {
          switch (val) {
            case 'fire':
              if (petItem.fire > maxValue) {
                maxValue = petItem.fire;
                maxElement = val;
              }
              break;
            case 'air':
              if (petItem.air > maxValue) {
                maxValue = petItem.air;
                maxElement = val;
              }
              break;
            case 'grass':
              if (petItem.grass > maxValue) {
                maxValue = petItem.grass;
                maxElement = val;
              }
              break;
            case 'water':
              if (petItem.water > maxValue) {
                maxValue = petItem.water;
                maxElement = val;
              }
              break;
          }
        });
        return maxElement;
      };
      // =========================================================================================================
      // END OF LOCAL FUNCTION maxElementFromPetInteraction(...)
      // =========================================================================================================

      // Choose the element from the most recent pet interaction's element parameters. As currently
      // coded, if there are more than one element parameters in the pet item associated with the interaction
      // that are both in the elements array and have the same value in the pet item, the precident
      // for what will be chosen will be 'water', 'grass', 'air', 'fire' because of how the
      // const stats is created above (the order of the keys).
      //
      // We have to loop backwards through interactions until we find a non-zero value for one
      // of the elements that are tied.
      //
      for (
        let i = 0;
        i < interactions.length && typeof element === 'undefined';
        i++
      ) {
        // Calling local function  above
        element = maxElementFromPetInteraction(interactions[i], elements);
      }

      return element;
    } else {
      return elements[0];
    }
  }
}
