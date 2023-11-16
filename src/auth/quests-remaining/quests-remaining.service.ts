/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Adam Goodman
 */

import { BadRequestException, Injectable, Query, Req } from '@nestjs/common';
import { CreateQuestsRemainingDto } from './dto/create-quests-remaining.dto';
import { UpdateQuestsRemainingDto } from './dto/update-quests-remaining.dto';
import { getRepository, In, Repository } from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Coolpets } from '../../entity/coolpets';
import { Environment } from '../../environment';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { Util } from '../../util';
import { Request } from 'express';
import { StakedPet } from '../../entity/staked-pet';
import { ERedisKey } from '../../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class QuestsRemainingService {
  blockchainContractRepository: Repository<BlockchainContract>;
  coolcatOwnerRepository: Repository<CoolcatOwner>;
  stakedPetRepository: Repository<StakedPet>;
  coolpetsRepository: Repository<Coolpets>;
  coolpetBlockchainContract: Promise<BlockchainContract>;
  initialised: boolean;

  private async init(): Promise<void> {
    if (!this.initialised) {
      this.blockchainContractRepository =
        getRepository<BlockchainContract>(BlockchainContract);
      this.coolcatOwnerRepository = getRepository<CoolcatOwner>(CoolcatOwner);
      this.stakedPetRepository = getRepository<StakedPet>(StakedPet);
      this.coolpetsRepository = getRepository<Coolpets>(Coolpets);
      this.coolpetBlockchainContract =
        this.blockchainContractRepository.findOne({
          where: {
            code: 'COOLPET_721',
            mode: Environment.env.MODE,
          },
        });

      this.initialised = true;
    }
  }

  create(createQuestsRemainingDto: CreateQuestsRemainingDto) {
    return 'This action adds a new questsRemaining';
  }

  async findAll(@Query() query, @Req() req: Request) {
    // Make sure we've created our class members
    await this.init();

    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `quests-remaining${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

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
    const owner: string = (req as any).ethAddress;

    // Figure out our options
    const options: FindManyOptions<Coolpets> = {
      take: limit,
      skip: skip,
      relations: ['pet_interactions'],
    };

    if (owner) {
      // Grab the coolpet contract
      const coolpetBlockchainContract: BlockchainContract = await this
        .coolpetBlockchainContract;
      if (!coolpetBlockchainContract) {
        throw new BadRequestException('Could not find COOLPET_721 record');
      }

      const ownedPets = await this.coolcatOwnerRepository.find({
        select: ['token_id'],
        where: {
          to: owner,
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

      // Hit the database to grab the pets !
      const [coolPets, total] = await this.coolpetsRepository.findAndCount(
        options,
      );

      let questWeb3ContractInstance: any;
      let interactionWeb3ContractInstance: any;

      // Grab reset time
      let resetTime: number | string = await Util.redisGet(
        ERedisKey.QUEST_RESET_TIME,
      );
      if (!resetTime) {
        questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
        resetTime = parseInt(
          await questWeb3ContractInstance.methods.getDailyResetTime().call(),
        ) as number;
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
        questsPerDay = parseInt(
          await questWeb3ContractInstance.methods._questAllowance().call(),
        ) as number;
        await Util.redisSet(
          ERedisKey.QUEST_PET_DAY,
          questsPerDay.toString(),
          900_000,
        );
      } else {
        questsPerDay = parseInt(questsPerDay);
      }

      // Grab the interactions per day
      let interactionsPerDay: number | string = await Util.redisGet(
        ERedisKey.INTERACTION_PER_DAY,
      );
      if (!interactionsPerDay) {
        if (!interactionWeb3ContractInstance) {
          interactionWeb3ContractInstance =
            await Util.resolvePetInteractionWeb3Contract();
        }
        interactionsPerDay = parseInt(
          await interactionWeb3ContractInstance.methods
            ._dailyInteractionAllowance()
            .call(),
        ) as number;
        await Util.redisSet(
          ERedisKey.INTERACTION_PER_DAY,
          interactionsPerDay.toString(),
          900_000,
        );
      } else {
        interactionsPerDay = parseInt(interactionsPerDay);
      }

      // Grab staked pets as a subset of coolPets
      const tokenIds = [];
      for (let i = 0; i < coolPets.length; i++) {
        tokenIds.push(coolPets[i].token_id);
      }
      const stakedPets: StakedPet[] = await this.stakedPetRepository.find({
        where: {
          token_id: In(tokenIds),
        },
      });

      for (const val of coolPets) {
        delete val.hat;
        delete val.face;
        delete val.chest;
        delete val.arm;
        delete val.body;
        delete val.back;
        delete val.element;

        delete val.air;
        delete val.fire;
        delete val.water;
        delete val.grass;

        delete val.id;

        delete val.image;
        delete val.name;
        delete val.description;

        (val as any).resetTimeEpoch = resetTime;
        (val as any).resetTime = new Date(resetTime * 1000).toISOString();
        (val as any).questsPerDay = questsPerDay;

        const questsRemainingToday =
          await Util.getQuestsRemainingForPetInDailyResetPeriod(val.token_id);
        (val as any).questsRemaining = questsRemainingToday;

        // if (val.quest_history.length > 0) {
        //   const recentQuest = val.quest_history[val.quest_history.length - 1]; // .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
        //   if (!questWeb3ContractInstance) {
        //     questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
        //   }
        //   const dailyCount = await questWeb3ContractInstance.methods.getDailyQuestCount(val.token_id).call();
        //   if (Date.parse(recentQuest.timestamp) / 1000 < (resetTime - 86400)) {
        //     (val as any).questsRemaining = questsPerDay;
        //   } else {
        //     (val as any).questsRemaining = questsPerDay - dailyCount;
        //   }
        // } else {
        //   (val as any).questsRemaining = questsPerDay;
        // }

        (val as any).interactionsPerDay = interactionsPerDay;

        if (val.pet_interactions.length > 0) {
          const recentInteraction =
            val.pet_interactions[val.pet_interactions.length - 1]; // .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
          if (!interactionWeb3ContractInstance) {
            interactionWeb3ContractInstance =
              await Util.resolvePetInteractionWeb3Contract();
          }
          const dailyCount = await interactionWeb3ContractInstance.methods
            .getDailyInteractionCount(val.token_id)
            .call();
          if (
            Date.parse(recentInteraction.timestamp) / 1000 <
            resetTime - 86400
          ) {
            (val as any).interactionsRemaining = interactionsPerDay;
          } else {
            (val as any).interactionsRemaining =
              interactionsPerDay - dailyCount;
          }
        } else {
          (val as any).interactionsRemaining = interactionsPerDay;
        }

        const stakedPet: StakedPet = stakedPets.find(
          (obj) => obj.token_id == val.token_id,
        );
        if (stakedPet) {
          (val as any).staked = stakedPet.staked;

          if (stakedPet.staked) {
            (val as any).adventureLockout = false;
          } else {
            (val as any).adventureLockout =
              Date.parse(stakedPet.timestamp) / 1000 >=
              (resetTime as number) - 86400;
          }
        } else {
          (val as any).staked = false;
          (val as any).canStake = questsRemainingToday < questsPerDay;

          (val as any).adventureLockout = false;
        }

        (val as any).itemInteractions = val.pet_interactions.length;
        // (val as any).itemInteractions = await Util.getPetInteractionCounts(val.token_id);
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
    } else {
      return {
        data: [],
        total: 0,
        limit: limit,
      };
    }
  }

  async findOne(id: number) {
    return `This action returns a #${id} questsRemaining`;
  }

  update(id: number, updateQuestsRemainingDto: UpdateQuestsRemainingDto) {
    return `This action updates a #${id} questsRemaining`;
  }

  remove(id: number) {
    return `This action removes a #${id} questsRemaining`;
  }
}
