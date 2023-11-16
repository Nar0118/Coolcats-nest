/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateConnectUserDto } from './dto/create-connect-user.dto';
import { UpdateConnectUserDto } from './dto/update-connect-user.dto';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entity/user';
import { Util } from '../../util';
import { Config } from '../../config';
import { getRepository } from 'typeorm';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class ConnectUserService {
  async create(
    createConnectUserDto: CreateConnectUserDto,
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

    await Util.mustHavePetOrCat(createConnectUserDto.address);

    // Same address cannot call connect more than 1 time every 2 minutes
    if (
      await Util.isRateLimitedAndSet(
        `connect-user-service-${createConnectUserDto.address}`,
        120000,
      )
    ) {
      throw new BadRequestException(`Too many requests`);
    }

    // NOW HANDLED BY A BLOCKCHAIN CHECK IN THE CONTROLLER
    // // Make sure the user is not already connected
    // let user: any;
    // try {
    //   user = await Util.getUserRecord(createConnectUserDto.address);
    // } catch (error) {
    //   throw new BadRequestException(`Invalid account address ${ createConnectUserDto.address }`);
    // }
    // if (user && user.properties && Object.keys(user.properties).length > 0) {
    //   Object.keys(user.properties).forEach((val: string) => {
    //     if (val === Config.USER_PROPERTY_IS_CONNECTED_KEY) {
    //       if (user.properties[val] === 'true') {
    //         throw new BadRequestException(`User ${ createConnectUserDto.address } is already connected`);
    //       }
    //     }
    //   });
    // }

    let signature = createConnectUserDto.signature;
    if (createConnectUserDto.ledger.toLowerCase() == 'true') {
      let v = parseInt(signature.substring(130, 132));

      if (v < 27) {
        v += 27;
      }

      if (v != 27 && v != 28) {
        throw new BadRequestException(`Invalid v value in signature`);
      }

      signature = signature.slice(0, -2) + v.toString(16);
    }

    // Validate signature
    const message = `Welcome to Cool Cats!\n\nClick to authorise Cool Cats to manage your Cooltopia tokens and accept our Terms of Service:\n\nhttps://www.coolcatsnft.com/terms\n\nThis will not trigger a blockchain transaction from your wallet or incur any fees.`;
    const signingWallet = ethers.utils.verifyMessage(message, signature);
    if (
      signingWallet.toLowerCase() !== createConnectUserDto.address.toLowerCase()
    ) {
      throw new BadRequestException(`Invalid signature to connect-user.`);
    }

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
        to: createConnectUserDto.address,
        blockchainContract: coolCatContract,
      },
    });

    // get the addresses currently owned pets
    const ownedPets = await contractRepository.find({
      where: {
        to: createConnectUserDto.address,
        blockchainContract: coolPetContract,
      },
    });

    if (ownedPets.length === 0 && ownedCoolCats.length === 0) {
      throw new NotFoundException(
        'Must own a cat or a pet to connect to the system',
      );
    }

    // =============================================================================
    // If we get here, we are ready to send the contract request to connect the user
    // =============================================================================

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'CONNECT_USER',
        guid,
        address: createConnectUserDto.address,
        nonce: createConnectUserDto.nonce,
        signature: signature,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `ConnectUser`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all connectUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} connectUser`;
  }

  update(id: number, updateConnectUserDto: UpdateConnectUserDto) {
    return `This action updates a #${id} connectUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} connectUser`;
  }
}
