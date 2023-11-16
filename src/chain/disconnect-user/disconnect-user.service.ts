/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';
import { CreateDisconnectUserDto } from './dto/create-disconnect-user.dto';
import { UpdateDisconnectUserDto } from './dto/update-disconnect-user.dto';
import { Util } from '../../util';
import { Config } from '../../config';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class DisconnectUserService {
  async create(createDisconnectUserDto: CreateDisconnectUserDto, req: Request) {
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

    // NOW HANDLED BY A BLOCKCHAIN CHECK IN THE CONTROLLER
    // // Make sure the user is currently connected
    // let user: any;
    // try {
    //   user = await Util.getUserRecord(createDisconnectUserDto.address);
    // } catch (error) {
    //   throw new BadRequestException(`Invalid account address ${ createDisconnectUserDto.address }`);
    // }
    // let isConnected = false;
    // if (user && user.properties && Object.keys(user.properties).length > 0) {
    //   Object.keys(user.properties).forEach((k: string) => {
    //     if (k === Config.USER_PROPERTY_IS_CONNECTED_KEY) {
    //       const val: string = user.properties[k];
    //       isConnected = val === "true";
    //     }
    //   });
    // }
    // if (!isConnected) {
    //   throw new BadRequestException(`User ${ createDisconnectUserDto.address } is not connected`);
    // }

    let signature = createDisconnectUserDto.signature;
    if (createDisconnectUserDto.ledger.toLowerCase() === `true`) {
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
    const message = `Leaving Cooltopia!\n\nClick the deauthorise Cool Cats from being able to manage your Cooltopia tokens\n\nThis will not trigger a blockchain transaction from your wallet or incur any fees.`;
    const signingWallet = ethers.utils.verifyMessage(message, signature);
    if (
      signingWallet.toLowerCase() !==
      createDisconnectUserDto.address.toLowerCase()
    ) {
      throw new BadRequestException(`Invalid signature to disconnect-user.`);
    }

    // ================================================================================
    // If we get here, we are ready to send the contract request to disconnect the user
    // ================================================================================

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'DISCONNECT_USER',
        guid,
        address: createDisconnectUserDto.address,
        nonce: createDisconnectUserDto.nonce,
        signature: signature,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `ConnectUser`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all disconnectUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} disconnectUser`;
  }

  update(id: number, updateDisconnectUserDto: UpdateDisconnectUserDto) {
    return `This action updates a #${id} disconnectUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} disconnectUser`;
  }
}
