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
import { CreateClaimGoldDto } from './dto/create-claim-gold.dto';
import { UpdateClaimGoldDto } from './dto/update-claim-gold.dto';
import { Any, getRepository, In, Repository } from 'typeorm';
import { DatabaseService } from '../../database.service';
import { ethers } from 'ethers';
import { ContractBase } from '../contract-base';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { Coolcats } from '../../entity/coolcats';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { ECacheKeys, Util, profile } from '../../util';
import { Request, Response } from 'express';
import * as AWS from 'aws-sdk';

@Injectable()
export class ClaimGoldService extends ContractBase {
  contractRepository: Repository<CoolcatOwner>;
  blockchainContractRepo: Repository<BlockchainContract>;
  ccRepository: Repository<Coolcats>;
  queue: AWS.SQS;
  coolCatContract: Promise<BlockchainContract>;

  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  private async init(): Promise<void> {
    if (!this.coolCatContract) {
      this.contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
      this.blockchainContractRepo =
        getRepository<BlockchainContract>(BlockchainContract);
      this.ccRepository = getRepository<Coolcats>(Coolcats);
      AWS.config.update({ region: Environment.env.AWS_REGION });
      this.queue = new AWS.SQS({ apiVersion: '2012-11-05' });

      // Grab our cool cat contract
      this.coolCatContract = this.blockchainContractRepo
        .findOne({
          where: {
            code: 'COOLCAT_721',
            mode: Environment.env.MODE,
          },
        })
        .then((res) => {
          if (!res) {
            throw new NotFoundException('COOLCAT_721 contract not found');
          }
          return res;
        });
    }
  }

  /**
   * Called to claim gold for a set of cats.
   * @param createClaimGoldDto
   */
  async create(
    createClaimGoldDto: CreateClaimGoldDto,
    req: Request,
    _res: Response,
  ) {
    // Make sure we have initialized our class members
    await this.init();

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

    // See if we can claim
    const ethAccount = (req as any).ethAddress;
    const nowEpoch: number = Math.floor(Date.now() / 1000);
    const nextClaimTime: number = await Util.getNextClaimTime(ethAccount);

    if (nextClaimTime > nowEpoch) {
      return {
        nextClaimTime,
        rateLimited: true,
      };
    }

    await Util.mustHavePetOrCat((req as any).ethAddress);

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    // First we need to get the guys currently owned cats
    const cats = await profile(`getting-cats-${guid}`, async () =>
      this.contractRepository.find({
        where: {
          to: ethAccount,
          blockchainContract: await this.coolCatContract,
        },
      }),
    );
    if (cats.length === 0) {
      throw new NotFoundException('No cats available to claim milk');
    }

    // Create an array of available owned cats
    let ownedCatIds: number[] = cats.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Determine our cat ids that we will pass on to the blockchain
    if (createClaimGoldDto.ids) {
      try {
        const idsAsArray: string[] = createClaimGoldDto.ids.split(',');
        const invalidCatIds: string[] = idsAsArray.filter((val: string) => {
          const intVal: number = parseInt(val);
          return isNaN(intVal) || !ownedCatIds.includes(intVal);
        });
        if (invalidCatIds.length > 0) {
          const errorMessage = `Invalid cat ids: ${invalidCatIds.join()}`;
          throw new Error(errorMessage);
        }
        ownedCatIds = idsAsArray.map((val: string) => {
          return parseInt(val);
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    // Now create our array of catClasses
    const coolCatRecords: Coolcats[] = await this.ccRepository.find({
      where: {
        token_id: In(ownedCatIds),
      },
    });

    const tierToPoints = {
      cool_1: 3,
      cool_2: 4,
      wild_1: 5,
      wild_2: 6,
      classy_1: 7,
      classy_2: 8,
      exotic_1: 9,
      exotic_2: 10,
    } as { [key: string]: number };
    const catKeyedById = coolCatRecords.reduce((memo, cc) => {
      memo[cc.token_id] = cc;
      return memo;
    }, {});
    ownedCatIds.forEach((id) => {
      if (!catKeyedById[id]) {
        throw new BadRequestException(`Could not find minted cool cat #${id}`);
      }
    });
    const classes = coolCatRecords.map((coolCatRecord) => {
      const points = tierToPoints[coolCatRecord.tier];
      if (!points) {
        throw new BadRequestException(
          `Invalid minted cat trait ${coolCatRecord.tier}`,
        );
      }
      return points;
    });

    // =======================================================================
    // If we get here, we are ready to send the contract request to claim gold
    // =======================================================================

    const MessageBody = JSON.stringify({
      type: 'CLAIM_GOLD',
      guid,
      address: ethAccount,
      ids: ownedCatIds,
      classes,
    });
    await profile(`queue.sendMessage-${guid}`, () =>
      this.queue
        .sendMessage({
          MessageBody,
          MessageDeduplicationId: `${guid}`,
          MessageGroupId: `ClaimGold`,
          QueueUrl: Environment.env.AWS_SQS_URL,
        })
        .promise(),
    );

    // Set next claim time in REDIS
    const claimAgainSecsString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'claimAgainSecs',
      3600000,
    );
    const claimAgainSecs: number = parseInt(claimAgainSecsString);
    const newNextClaimTime = nowEpoch + claimAgainSecs;
    setTimeout(async () => {
      const nextMilkClaimKey: string = await Util.getUserCacheKey(
        ethAccount,
        ECacheKeys.NEXT_MILK_CLAIM,
      );
      await Util.redisDel(nextMilkClaimKey);
      await Util.redisSet(
        nextMilkClaimKey,
        newNextClaimTime.toString(),
        1000 * claimAgainSecs,
      );
    }, 0);

    return { messageGuid: guid.substr(2) };
  }

  async findAll() {
    return 'GET method not supported on this endpoint';
  }

  findOne(id: number) {
    return `This action returns a #${id} claimGold`;
  }

  update(id: number, _updateClaimGoldDto: UpdateClaimGoldDto) {
    return `This action updates a #${id} claimGold`;
  }

  remove(id: number) {
    return `This action removes a #${id} claimGold`;
  }
}
