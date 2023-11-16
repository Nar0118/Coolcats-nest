import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { CreateSyncItemDto } from './dto/create-sync-item.dto';
import { UpdateSyncItemDto } from './dto/update-sync-item.dto';
import { Request } from 'express';
import { Util } from '../../util';
import { PetUserItem } from '../../entity/pet-user-item';
import { getRepository } from 'typeorm';
import { User } from '../../entity/user';
import { PetItem } from '../../entity/pet-item';

@Injectable()
export class SyncItemsService {
  async create(createSyncItemDto: CreateSyncItemDto, @Req() req: Request) {
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

    // Get all of our item quantities that we have
    const myBlockchainItems: number[] = await Util.getPetItemAndBoxBalance(
      (req as any).ethAddress,
    );

    // Grab the database items
    const myDatabaseeItems: PetUserItem[] | undefined =
      await getRepository<PetUserItem>(PetUserItem).find({
        relations: ['user', 'pet_item'],
        where: {
          user: { account: (req as any).ethAddress },
        },
      });

    // Grab the user
    const user: User | undefined = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });
    if (!user) {
      throw new BadRequestException(
        `Cannot find user ${(req as any).ethAddress}`,
      );
    }

    const toRet: any = {
      account: (req as any).ethAddress,
      adjusted: false,
    };

    // Iterate through each one, making sure the database matches the blockchain
    const petItemRepo = getRepository<PetUserItem>(PetUserItem);
    myBlockchainItems.forEach(async (myItemQuantity: number, index: number) => {
      myItemQuantity = parseInt(myItemQuantity as any);
      const itemId: number = index + 1;
      const foundDatabaseItem: PetUserItem = myDatabaseeItems.find(
        (val: PetUserItem) => {
          return val.pet_item.item_id === itemId;
        },
      );
      if (!foundDatabaseItem) {
        if (myItemQuantity > 0) {
          // Item is missing from the database
          toRet.adjusted = true;

          // Retrieve the petItem record
          const petItem: PetItem | undefined = await getRepository<PetItem>(
            PetItem,
          ).findOne({
            item_id: itemId,
          });
          if (!petItem) {
            throw new BadRequestException(`Could not find item ${itemId}`);
          }

          const petUserItem: PetUserItem = new PetUserItem();
          petUserItem.user = user;
          petUserItem.pet_item = petItem;
          petUserItem.quantity = myItemQuantity;
          await petItemRepo.save<PetUserItem>(petUserItem);
        }
      } else {
        if (foundDatabaseItem.quantity !== myItemQuantity) {
          // Quantities did not match
          toRet.adjusted = true;

          foundDatabaseItem.quantity = myItemQuantity;
          await petItemRepo.save<PetUserItem>(foundDatabaseItem);
        }
      }
    });

    return toRet;
  }

  findAll() {
    return `This action returns all syncItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} syncItem`;
  }

  update(id: number, updateSyncItemDto: UpdateSyncItemDto) {
    return `This action updates a #${id} syncItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} syncItem`;
  }
}
