/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { Util } from '../../util';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class ListItemService {
  async create(createListItemDto: CreateListItemDto, req) {
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

    if (parseInt(createListItemDto.quantity) <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (parseInt(createListItemDto.price) <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    // Grab the number of items this user has (of the specified itemTokenId)
    const itemCount: number = await Util.getItemCount(
      (req as any).ethAddress,
      parseInt(createListItemDto.itemTokenId),
    );

    // Make sure we have the required items we are going to list
    if (parseInt(createListItemDto.quantity) > itemCount) {
      throw new BadRequestException(
        `Requested quantity of item(s) #${
          createListItemDto.itemTokenId
        } to list of ${
          createListItemDto.quantity
        } exceeds quantity of items held ${itemCount} by user ${
          (req as any).ethAddress
        }`,
      );
    }

    // -----------------------------------------------------------
    // IF WE GET HERE, THE USER OWNS SUFFICIENT ITEMS TO LIST THEM
    // -----------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'CREATE_LISTING',
        guid,
        seller: (req as any).ethAddress,
        itemTokenId: parseInt(createListItemDto.itemTokenId),
        amount: parseInt(createListItemDto.quantity),
        price: parseInt(createListItemDto.price),
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `CreateListing`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all listItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listItem`;
  }

  update(id: number, updateListItemDto: UpdateListItemDto) {
    return `This action updates a #${id} listItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} listItem`;
  }
}
