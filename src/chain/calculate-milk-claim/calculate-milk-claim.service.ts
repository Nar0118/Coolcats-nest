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
  Req,
} from '@nestjs/common';
import { CreateCalculateMilkClaimDto } from './dto/create-calculate-milk-claim.dto';
import { UpdateCalculateMilkClaimDto } from './dto/update-calculate-milk-claim.dto';
import { getRepository, In, Repository } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { ethers } from 'ethers';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { Coolcats } from '../../entity/coolcats';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class CalculateMilkClaimService {
  create(createCalculateMilkClaimDto: CreateCalculateMilkClaimDto) {
    return 'This action adds a new calculateMilkClaim';
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

    // Validate our catIds parameter
    let catIdsToCheckClaim: number[];
    if (query?.catIds) {
      const asArray: any[] = query.catIds.split(',');
      catIdsToCheckClaim = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || asInt < 0) {
          throw new BadRequestException(
            `catIds parameter must be an array of cat token ids`,
          );
        }
        return asInt;
      });
    } else {
      throw new BadRequestException(
        `catIds parameter is missing and must be an array of cat token ids`,
      );
    }

    // Create instance of the TREASURY contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const treasuryContract: BlockchainContract =
      await blockchainContractRepository.findOne({
        where: {
          code: 'TREASURY',
          mode: Environment.env.MODE,
        },
      });
    if (!treasuryContract) {
      throw new NotFoundException('TREASURY contract not found');
    }

    const coolCatContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'COOLCAT_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolCatContract) {
      throw new NotFoundException('COOLCAT_721 contract not found');
    }

    // First we need to get the guys currently owned cats
    const ownedCats = await getRepository<CoolcatOwner>(CoolcatOwner).find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolCatContract,
      },
    });
    if (ownedCats.length === 0) {
      throw new NotFoundException('No cats available to claim milk');
    }

    // Create an array of available owned cats
    const ownedCatIds: number[] = ownedCats.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Make sure we are only working with owned pets
    const ownedCatIdsToCheckClaim: number[] = new Array<number>();
    catIdsToCheckClaim.forEach((val: number) => {
      if (ownedCatIds.indexOf(val) >= 0) {
        ownedCatIdsToCheckClaim.push(val);
      }
    });
    if (ownedCatIdsToCheckClaim.length === 0) {
      throw new NotFoundException(
        `No owned cats (${
          (req as any).ethAddress
        }) available to calculate milk to claim`,
      );
    }

    /**
     * Get Coolcat records for all ownedCatIdsToCheckClaim
     */
    const coolCatsToCheckClaim: Coolcats[] = await getRepository<Coolcats>(
      Coolcats,
    ).find({
      token_id: In(ownedCatIdsToCheckClaim),
    });
    if (coolCatsToCheckClaim.length !== ownedCatIdsToCheckClaim.length) {
      throw new BadRequestException(
        `Coolcats to check ${ownedCatIdsToCheckClaim.length} not equal to record count ${coolCatsToCheckClaim.length}`,
      );
    }

    // Create our parameters for the blockchain call
    const orderedOwnedCatIdsToCheckClaim: number[] = new Array<number>();
    const ownedCatClasses: number[] = new Array<number>();
    for (const coolCatRecord of coolCatsToCheckClaim) {
      orderedOwnedCatIdsToCheckClaim.push(coolCatRecord.token_id);

      // Figure out class
      let points = 0;
      switch (coolCatRecord.tier) {
        case 'cool_1':
          points = 3;
          break;
        case 'cool_2':
          points = 4;
          break;
        case 'wild_1':
          points = 5;
          break;
        case 'wild_2':
          points = 6;
          break;
        case 'classy_1':
          points = 7;
          break;
        case 'classy_2':
          points = 8;
          break;
        case 'exotic_1':
          points = 9;
          break;
        case 'exotic_2':
          points = 10;
          break;
        default:
          throw new BadRequestException(
            `Invalid minted cat trait ${coolCatRecord[0].tier}`,
          );
      }
      ownedCatClasses.push(points);
    }

    // Grab provider
    let web3: any;
    const providers: string[] = treasuryContract.provider.split('|');
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
      treasuryContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Call the  contract method calcClaim
    const contract: any = new web3.eth.Contract(abi, treasuryContract.address);
    try {
      const result = await contract.methods
        .calcClaim(orderedOwnedCatIdsToCheckClaim, ownedCatClasses)
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
    return `This action returns a #${id} calculateMilkClaim`;
  }

  update(id: number, updateCalculateMilkClaimDto: UpdateCalculateMilkClaimDto) {
    return `This action updates a #${id} calculateMilkClaim`;
  }

  remove(id: number) {
    return `This action removes a #${id} calculateMilkClaim`;
  }
}
