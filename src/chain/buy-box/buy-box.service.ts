/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBuyBoxDto } from './dto/create-buy-box.dto';
import { UpdateBuyBoxDto } from './dto/update-buy-box.dto';
import { Util } from '../../util';
import { Request } from 'express';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class BuyBoxService {
  async create(createBuyBoxDto: CreateBuyBoxDto, req: Request) {
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

    if (parseInt(createBuyBoxDto.quantity) > 100) {
      throw new BadRequestException(
        `You can only purchase a maximum of 100 Cool Boxes at a time`,
      );
    }

    // Grab the box price from the
    const boxPrice: string = await Util.getBoxPrice();

    // Calculate total price
    const totalPrice: number =
      parseInt(boxPrice) * parseInt(createBuyBoxDto.quantity);

    // Grab user's gold balance
    const goldBalance: string = await Util.goldBalance((req as any).ethAddress);

    if (parseInt(goldBalance) < totalPrice) {
      throw new BadRequestException(
        `Total purchase price of ${totalPrice} exceeds gold balance for user ${
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
        type: 'BUY_BOX',
        guid,
        address: (req as any).ethAddress,
        quantity: createBuyBoxDto.quantity,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `BuyBox`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all buyBox`;
  }

  findOne(id: number) {
    return `This action returns a #${id} buyBox`;
  }

  update(id: number, updateBuyBoxDto: UpdateBuyBoxDto) {
    return `This action updates a #${id} buyBox`;
  }

  remove(id: number) {
    return `This action removes a #${id} buyBox`;
  }
}
