/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOpenBoxDto } from './dto/create-open-box.dto';
import { UpdateOpenBoxDto } from './dto/update-open-box.dto';
import { Request } from 'express';
import { Util } from '../../util';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class OpenBoxService {
  async create(createOpenBoxDto: CreateOpenBoxDto, req: Request) {
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

    if (parseInt(createOpenBoxDto.quantity) > 20) {
      throw new BadRequestException(
        `Requested quantity of boxes to open of ${createOpenBoxDto.quantity} exceeds maximum quantity of boxes to open at a time of 20`,
      );
    }

    // Grab the box price from the
    const boxCount: number = await Util.getItemCount(
      (req as any).ethAddress,
      1,
    );

    // Make sure we have the required boxes to open
    if (parseInt(createOpenBoxDto.quantity) > boxCount) {
      throw new BadRequestException(
        `Requested quantity of boxes to open of ${
          createOpenBoxDto.quantity
        } exceeds quantity of boxes held ${boxCount} by user ${
          (req as any).ethAddress
        }`,
      );
    }

    // ---------------------------------------------------------------------------------------------------------------
    // IF WE GET HERE, THE USER HAS ENOUGH GOLD TO PURCHASE THE BOX, SO FEED IT OVER TO THE WORKER SERVICE TO COMPLETE
    // ---------------------------------------------------------------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'OPEN_BOX',
        guid,
        address: (req as any).ethAddress,
        quantity: createOpenBoxDto.quantity,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `OpenBox`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all openBox`;
  }

  findOne(id: number) {
    return `This action returns a #${id} openBox`;
  }

  update(id: number, updateOpenBoxDto: UpdateOpenBoxDto) {
    return `This action updates a #${id} openBox`;
  }

  remove(id: number) {
    return `This action removes a #${id} openBox`;
  }
}
