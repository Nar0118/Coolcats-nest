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
import { CreatePetInteractionDto } from './dto/create-pet-interaction.dto';
import { UpdatePetInteractionDto } from './dto/update-pet-interaction.dto';
import { Request } from 'express';
import { getRepository, In } from 'typeorm';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { Util } from '../../util';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { Coolpets } from '../../entity/coolpets';
import { PetItem } from '../../entity/pet-item';
import { ERedisKey } from '../../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class PetInteractionService {
  async create(createPetInteractionDto: CreatePetInteractionDto, req: Request) {
    const ethAddress = (req as any).ethAddress;
    /**
     * Make sure service is available
     */
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
    const petTokenId = parseInt(createPetInteractionDto.petTokenId);
    if (Number.isNaN(petTokenId)) {
      throw new BadRequestException(`Invalid itemTokenId parameter`);
    }
    if (!Number.isInteger(petTokenId)) {
      throw new BadRequestException(`Item Id ${petTokenId} must be an integer`);
    }

    let itemTokenIds: number[];
    if (createPetInteractionDto.itemTokenIds) {
      const asArray: any[] = createPetInteractionDto.itemTokenIds.split(',');
      itemTokenIds = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || !Number.isInteger(asInt) || asInt < 0) {
          throw new BadRequestException(
            `Item Id ${val} must be a positive integer`,
          );
        }
        return asInt;
      });
    } else {
      throw new BadRequestException(
        'Parameter itemTokenIds is missing and must be an array of item token ids',
      );
    }

    // Grab our cool pet contract
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const coolPetContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolPetContract) {
      throw new NotFoundException('COOLPET_721 contract not found');
    }

    // Make sure the pet exists
    const petRepo = getRepository<CoolcatOwner>(CoolcatOwner);
    const pet: CoolcatOwner | undefined = await petRepo.findOne({
      token_id: petTokenId,
      blockchainContract: coolPetContract,
    });
    if (!pet) {
      throw new BadRequestException(
        `Pet with ID: ${petTokenId} does not exist - 1`,
      );
    }

    // Make sure the pet is not in final form
    const coolpetRepo = getRepository<Coolpets>(Coolpets);
    const coolpet: Coolpets | undefined = await coolpetRepo.findOne({
      where: {
        token_id: parseInt(createPetInteractionDto.petTokenId),
      },
      relations: ['pet_interactions'],
    });
    if (!coolpet) {
      throw new BadRequestException(
        `Pet with ID: ${createPetInteractionDto.petTokenId} does not exist - 2`,
      );
    }
    if (coolpet.element && coolpet.element.length > 0) {
      throw new BadRequestException(
        `Pet with ID: ${createPetInteractionDto.petTokenId} is already of element type ${coolpet.element}`,
      );
    }

    // Make sure logged in user owns it
    if (pet.to.toLowerCase() !== (req as any).ethAddress.toLowerCase()) {
      throw new BadRequestException(
        `Pet ID: ${createPetInteractionDto.petTokenId} is not owned by ${
          (req as any).ethAddress
        }`,
      );
    }

    const petItems: PetItem[] = await getRepository<PetItem>(PetItem).find({
      where: {
        pet_type: {
          pet_category: {
            name: 'Pet',
          },
        },
      },
      relations: ['pet_type', 'pet_type.pet_category'],
    });

    if (petItems.length === 0) {
      throw new NotFoundException(`No pet items found.`);
    }

    const petItemIds = petItems.map((petItem: PetItem) => petItem.item_id);

    for (let i = 0; i < itemTokenIds.length; i++) {
      if (!petItemIds.includes(itemTokenIds[i])) {
        throw new BadRequestException(
          `Item with Id of ${itemTokenIds[i]} is not a pet item`,
        );
      }
    }

    let petWeb3ContractInstance =
      await Util.resolvePetInteractionWeb3Contract();

    // Grab reset time
    let resetTime: number | string = await Util.redisGet(
      ERedisKey.INTERACTION_RESET_TIME,
    );
    if (!resetTime) {
      petWeb3ContractInstance = await Util.resolvePetInteractionWeb3Contract();
      resetTime = parseInt(
        await petWeb3ContractInstance.methods.getDailyResetTime().call(),
      ) as number;
      await Util.redisSet(
        ERedisKey.INTERACTION_RESET_TIME,
        resetTime.toString(),
        60_000,
      );
    } else {
      resetTime = parseInt(resetTime);
    }

    // Grab the interactions per day
    let interactionsPerDay: number | string = await Util.redisGet(
      ERedisKey.INTERACTION_PER_DAY,
    );
    if (!interactionsPerDay) {
      if (!petWeb3ContractInstance) {
        petWeb3ContractInstance =
          await Util.resolvePetInteractionWeb3Contract();
      }
      interactionsPerDay = parseInt(
        await petWeb3ContractInstance.methods
          ._dailyInteractionAllowance()
          .call(),
      ) as number;
      await Util.redisSet(
        ERedisKey.INTERACTION_PER_DAY,
        interactionsPerDay.toString(),
        300_000,
      );
    } else {
      interactionsPerDay = parseInt(interactionsPerDay);
    }

    let interactionsRemaining;

    if (coolpet.pet_interactions.length > 0) {
      const recentInteraction =
        coolpet.pet_interactions[coolpet.pet_interactions.length - 1]; // .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
      if (!petWeb3ContractInstance) {
        petWeb3ContractInstance =
          await Util.resolvePetInteractionWeb3Contract();
      }
      const dailyCount = await petWeb3ContractInstance.methods
        .getDailyInteractionCount(coolpet.token_id)
        .call();
      if (Date.parse(recentInteraction.timestamp) / 1000 < resetTime - 86400) {
        interactionsRemaining = interactionsPerDay;
      } else {
        interactionsRemaining = interactionsPerDay - dailyCount;
      }
    } else {
      interactionsRemaining = interactionsPerDay;
    }

    if (!interactionsRemaining && parseInt(interactionsRemaining) != 0) {
      throw new NotFoundException(
        `Could not load interactions remaining for pet #${coolpet.token_id}.`,
      );
    }
    if (parseInt(interactionsRemaining) === 0) {
      throw new BadRequestException(
        `Pet #${coolpet.token_id} has reached their daily interaction limit.`,
      );
    }

    // --------------------------------------------------------------------------------------------------------------------
    // If we get here, the logged in user owns the pet being used as well as at leeast 1 of the specified items being used.
    // We are now ready to send the pet interaction call to the blockchain (via the NodeJS Worker Service)
    // --------------------------------------------------------------------------------------------------------------------

    if (parseInt(interactionsRemaining) < itemTokenIds.length) {
      throw new Error(
        `pet does not have enough interactions remaining for all of the interactions to succeed!}`,
      );
    }

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    for (const itemTokenId of itemTokenIds) {
      // Calculate our GUID for this interaction
      const slug: string = uuidv4();
      const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

      await SQS.sendMessage({
        MessageBody: JSON.stringify({
          type: 'PET_INTERACTION',
          guid,
          address: ethAddress,
          petTokenId,
          itemTokenId,
        }),
        MessageDeduplicationId: `${guid}`,
        MessageGroupId: `PetInteraction`,
        QueueUrl: Environment.env.AWS_SQS_URL,
      }).promise();
    }

    return {
      success: true,
      message: `Successfully sent ${itemTokenIds.length} interaction(s) to the blockchain.`,
    };
  }

  findAll() {
    return `This action returns all petInteraction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} petInteraction`;
  }

  update(id: number, updatePetInteractionDto: UpdatePetInteractionDto) {
    return `This action updates a #${id} petInteraction`;
  }

  remove(id: number) {
    return `This action removes a #${id} petInteraction`;
  }
}
