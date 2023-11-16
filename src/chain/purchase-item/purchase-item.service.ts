import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreatePurchaseItemDto } from './dto/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Util } from '../../util';
import { MarketplaceListing } from '../../entity/marketplace-listing';
import { getRepository } from 'typeorm';
import { ethers } from 'ethers';
import { Environment } from '../../environment';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class PurchaseItemService {
  async create(
    createPurchaseItemDto: CreatePurchaseItemDto,
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

    await Util.mustHavePetOrCat((req as any).ethAddress);

    const listing: MarketplaceListing | undefined =
      await getRepository<MarketplaceListing>(MarketplaceListing).findOne({
        relations: ['user'],
        where: { listingId: createPurchaseItemDto.listingId },
      });
    if (!listing) {
      throw new NotFoundException(
        `Listing ${createPurchaseItemDto.listingId} not found.`,
      );
    }
    if (!isNaN(listing.remove_timestamp.getTime())) {
      throw new BadRequestException(
        `Listing ${createPurchaseItemDto.listingId} has been removed.`,
      );
    }
    if (listing.buyer && listing.buyer.length > 0) {
      throw new BadRequestException(
        `Listing ${createPurchaseItemDto.listingId} was already purchased.`,
      );
    }
    if (
      listing.user.account.toUpperCase() ===
      (req as any).ethAddress.toUpperCase()
    ) {
      throw new BadRequestException(
        `You cannot purchase a listing that you posted.`,
      );
    }

    const goldBalance: ethers.BigNumber = ethers.BigNumber.from(
      await Util.goldBalance((req as any).ethAddress),
    );
    const price = ethers.utils.parseEther(`${listing.price}`);
    if (price.gt(goldBalance)) {
      throw new BadRequestException(
        `User ${(req as any).ethAddress} cannot afford listing with id ${
          listing.listingId
        }`,
      );
    }

    // -----------------------------------------------------------
    // IF WE GET HERE, THE USER OWNS THE LISTING AND IT IS BUYABLE
    // -----------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'BUY_LISTING',
        guid,
        buyer: (req as any).ethAddress,
        listingId: parseInt(createPurchaseItemDto.listingId),
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `BuyListing`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all purchaseItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} purchaseItem`;
  }

  update(id: number, updatePurchaseItemDto: UpdatePurchaseItemDto) {
    return `This action updates a #${id} purchaseItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} purchaseItem`;
  }
}
