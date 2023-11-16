/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Adam Goodman
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateAdventureClaimDto } from './dto/create-adventure-claim.dto';
import { UpdateAdventureClaimDto } from './dto/update-adventure-claim.dto';
import { Request } from 'express';
import { getRepository, In } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { StakedPet } from '../../entity/staked-pet';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class AdventureClaimService {
  async create(
    createAdventureClaimDto: CreateAdventureClaimDto,
    @Req() req: Request,
  ) {
    /**
     * Make sure service is available
     */
    const serviceUnavailable: boolean = await Util.serviceUnavailable(
      (req as any).ethAddress,
    );
    if (serviceUnavailable) {
      throw new BadRequestException(
        'Service is temporarily unavailable, please try again later',
      );
    }

    await Util.mustHavePetOrCat((req as any).ethAddress);

    // Validate our petIds parameter
    const asArray: any[] = createAdventureClaimDto.petIds.split(',');
    const petIdsToClaim: number[] = asArray.map((val: any) => {
      const asInt: number = parseInt(val);
      if (isNaN(asInt) || asInt < 0) {
        throw new BadRequestException(
          `petIds parameter must be an array of pet token ids`,
        );
      }
      return asInt;
    });

    // Grab our cool cats contract
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const coolCatContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLCAT_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolCatContract) {
      throw new NotFoundException('COOLCAT_721 contract not found');
    }

    // Grab our cool pets contract
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

    // First we need to get the addresses currently owned cats
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedCoolCats: CoolcatOwner[] = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolCatContract,
      },
    });
    if (ownedCoolCats.length === 0) {
      throw new BadRequestException(
        `User ${
          (req as any).ethAddress
        } must own at least one Cool Cat to claim adventuring milk. Unstake instead.`,
      );
    }

    // get the addresses currently owned pets
    const ownedPets = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolPetContract,
      },
    });
    if (ownedPets.length === 0) {
      throw new NotFoundException('No pets available to claim milk');
    }

    // Create an array of available owned pets
    const ownedPetIds: number[] = ownedPets.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Determine our pet ids that we will pass on to the blockchain
    const ownedPetIdsToClaim: number[] = petIdsToClaim.filter((val: number) => {
      return ownedPetIds.includes(val);
    });
    if (ownedPetIdsToClaim.length === 0) {
      throw new NotFoundException(
        `None of the petIds specified are owned by user ${
          (req as any).ethAddress
        }`,
      );
    }

    // Get all staked pets owned by the logged in user
    const stakedPets: StakedPet[] | undefined = await getRepository<StakedPet>(
      StakedPet,
    ).find({
      where: {
        token_id: In(ownedPetIdsToClaim),
        staked: true,
      },
    });
    if (stakedPets.length === 0) {
      throw new NotFoundException(
        `None of the petIds specified have been staked by user ${
          (req as any).ethAddress
        }`,
      );
    }

    // =======================================================================
    // If we get here, we are ready to send the contract request to claim gold
    // =======================================================================

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'CLAIM_ADVENTURE_GOLD',
        guid,
        address: (req as any).ethAddress,
        ids: petIdsToClaim,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `ClaimAdventureGold`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all adventureClaim`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adventureClaim`;
  }

  update(id: number, updateAdventureClaimDto: UpdateAdventureClaimDto) {
    return `This action updates a #${id} adventureClaim`;
  }

  remove(id: number) {
    return `This action removes a #${id} adventureClaim`;
  }
}
