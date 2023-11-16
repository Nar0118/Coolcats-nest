import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDelistItemDto } from './dto/create-delist-item.dto';
import { UpdateDelistItemDto } from './dto/update-delist-item.dto';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from 'typeorm';
import { MarketplaceListing } from '../../entity/marketplace-listing';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class DelistItemService {
  async create(createDelistItemDto: CreateDelistItemDto, req: Request) {
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

    const listing: MarketplaceListing | undefined =
      await getRepository<MarketplaceListing>(MarketplaceListing).findOne({
        relations: ['user'],
        where: {
          listingId: createDelistItemDto.listingId,
          user: { account: (req as any).ethAddress },
        },
      });
    if (!listing) {
      throw new NotFoundException(
        `Listing ${createDelistItemDto.listingId} not found for user ${
          (req as any).ethAddress
        }.`,
      );
    }
    if (!isNaN(listing.remove_timestamp.getTime())) {
      throw new BadRequestException(
        `Listing ${createDelistItemDto.listingId} was already removed.`,
      );
    }

    // -------------------------------------------------------------
    // IF WE GET HERE, THE USER OWNS THE LISTING AND IT IS REMOVABLE
    // -------------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'REMOVE_LISTING',
        guid,
        seller: (req as any).ethAddress,
        listingId: parseInt(createDelistItemDto.listingId),
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `RemoveListing`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all delistItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} delistItem`;
  }

  update(id: number, updateDelistItemDto: UpdateDelistItemDto) {
    return `This action updates a #${id} delistItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} delistItem`;
  }
}
