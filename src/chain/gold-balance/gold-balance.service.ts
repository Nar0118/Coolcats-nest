/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateGoldBalanceDto } from './dto/create-gold-balance.dto';
import { UpdateGoldBalanceDto } from './dto/update-gold-balance.dto';
import { Request } from 'express';
import { getRepository, Repository } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class GoldBalanceService {
  create(createGoldBalanceDto: CreateGoldBalanceDto) {
    return 'This action adds a new goldBalance';
  }

  async findAll(req: Request) {
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

    // Create instance of the gold contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract =
      await blockchainContractRepository.findOne({
        where: {
          code: 'GOLD_CONTRACT',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      let web3: any;
      const providers: string[] = blockchainContract.provider.split('|');
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
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      const nextClaimTime: number = await Util.getNextClaimTime(
        (req as any).ethAddress,
      );
      const friendlyNextClaimTime: string = new Date(
        1000 * nextClaimTime,
      ).toString();
      const inLaunchMode = await Util.inLaunchMode();

      try {
        const result = await contract.methods
          .balanceOf((req as any).ethAddress)
          .call();
        return {
          account: (req as any).ethAddress,
          goldBalance: result,
          nextClaimTime,
          friendlyNextClaimTime,
          inLaunchMode,
        };
      } catch (err) {
        throw new BadRequestException(err);
      }
    } else {
      throw new BadRequestException('Could not find GOLD_CONTRACT');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} goldBalance`;
  }

  update(id: number, updateGoldBalanceDto: UpdateGoldBalanceDto) {
    return `This action updates a #${id} goldBalance`;
  }

  remove(id: number) {
    return `This action removes a #${id} goldBalance`;
  }
}
