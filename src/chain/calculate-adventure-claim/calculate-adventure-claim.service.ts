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
import { CreateCalculateAdventureClaimDto } from './dto/create-calculate-adventure-claim.dto';
import { UpdateCalculateAdventureClaimDto } from './dto/update-calculate-adventure-claim.dto';
import { Request } from 'express';
import { getRepository, Repository } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { ethers } from 'ethers';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class CalculateAdventureClaimService {
  create(createCalculateAdventureClaimDto: CreateCalculateAdventureClaimDto) {
    return 'This action adds a new calculateAdventureClaim';
  }

  async findAll(@Req() req, @Query() query) {
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
    let petIdsToCheckClaim: number[];
    if (query?.petIds) {
      const asArray: any[] = query.petIds.split(',');
      petIdsToCheckClaim = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || asInt < 0) {
          throw new BadRequestException(
            `petIds parameter must be an array of pet token ids`,
          );
        }
        return asInt;
      });
    } else {
      throw new BadRequestException(
        `petIds parameter is missing and must be an array of pet token ids`,
      );
    }

    // Create instance of the ADVENTURERS_GUILD contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const adventureContract: BlockchainContract =
      await blockchainContractRepository.findOne({
        where: {
          code: 'ADVENTURERS_GUILD',
          mode: Environment.env.MODE,
        },
      });
    if (!adventureContract) {
      throw new NotFoundException('ADVENTURERS_GUILD contract not found');
    }

    const coolPetContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolPetContract) {
      throw new NotFoundException('COOLPET_721 contract not found');
    }

    // First we need to get the guys currently owned pets
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedPets = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolPetContract,
      },
    });
    if (ownedPets.length === 0) {
      throw new NotFoundException(
        'No pets available to calculate milk to claim',
      );
    }

    // Create an array of available owned pets
    const ownedPetIds: number[] = ownedPets.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Make sure we are only working with owned pets
    const ownedPetIdsToCheckClaim: number[] = new Array<number>();
    petIdsToCheckClaim.forEach((val: number) => {
      if (ownedPetIds.indexOf(val) >= 0) {
        ownedPetIdsToCheckClaim.push(val);
      }
    });
    if (ownedPetIdsToCheckClaim.length === 0) {
      throw new NotFoundException(
        `No owned pets (${
          (req as any).ethAddress
        }) available to calculate milk to claim`,
      );
    }

    // Grab provider
    let web3: any;
    const providers: string[] = adventureContract.provider.split('|');
    const provider: string = providers[0];
    if (provider.indexOf('wss') >= 0) {
      web3 = new Web3(
        new Web3.providers.WebsocketProvider(provider, {
          clientConfig: {
            maxReceivedFrameSize: 100000000,
            maxReceivedMessageSize: 100000000,
          },
        }),
      );
    } else {
      web3 = new Web3(
        new Web3.providers.HttpProvider(provider, {
          clientConfig: {
            maxReceivedFrameSize: 100000000,
            maxReceivedMessageSize: 100000000,
          },
        }),
      );
    }

    // Grab ABI
    const abi: any = JSON.parse(
      adventureContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    const contract: any = new web3.eth.Contract(abi, adventureContract.address);

    // Make blockchain call
    try {
      const result = await contract.methods
        .calculateClaim(ownedPetIdsToCheckClaim, 0)
        .call();
      return {
        account: (req as any).ethAddress,
        reward: ethers.utils.formatEther(result),
      };
    } catch (err) {
      const message: string = err?.message
        ? err.message
        : 'Unexpected error calling blockchain';
      throw new BadRequestException(message);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} calculateAdventureClaim`;
  }

  update(
    id: number,
    updateCalculateAdventureClaimDto: UpdateCalculateAdventureClaimDto,
  ) {
    return `This action updates a #${id} calculateAdventureClaim`;
  }

  remove(id: number) {
    return `This action removes a #${id} calculateAdventureClaim`;
  }
}
