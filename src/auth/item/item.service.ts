/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { getRepository, MoreThan, Repository } from 'typeorm';
import { PetItem } from '../../entity/pet-item';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Environment } from '../../environment';
import { Util } from '../../util';
import { PetUserItem } from '../../entity/pet-user-item';

@Injectable()
export class ItemService {
  create(createItemDto: CreateItemDto) {
    return 'This action adds a new item';
  }

  async findAll(query: any) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `item-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const petItemRepo: Repository<PetItem> = getRepository<PetItem>(PetItem);

    try {
      // Pagination
      let limit: number = query.limit ? parseInt(query.limit) : 10;
      if (isNaN(limit) || limit <= 0) {
        limit = 10;
      }
      let page: number = query.page ? parseInt(query.page) : 1;
      if (isNaN(page) || page < 1) {
        page = 1;
      }
      const skip = (page - 1) * limit;

      // Parse owner
      const owner: string = query.owner ? query.owner : undefined;
      if (owner) {
        const options: FindManyOptions<PetUserItem> = {
          take: limit,
          skip: skip,
          relations: [
            'user',
            'pet_item',
            'pet_item.pet_type',
            'pet_item.pet_type.pet_category',
          ],
        };

        if (query.itemId) {
          // Filter by user AND itemId
          options.where = {
            user: { account: owner },
            quantity: MoreThan(0),
            pet_item: { item_id: query.itemId },
          };
        } else {
          // Filter just by user
          options.where = {
            user: { account: owner },
            quantity: MoreThan(0),
          };
        }

        // Items for a particular owner
        const data = new Array<any>();
        const petUserItemRepo: Repository<PetUserItem> =
          getRepository(PetUserItem);
        const [petUserItems, total] = await petUserItemRepo.findAndCount(
          options,
        );
        if (petUserItems) {
          petUserItems.forEach((petUserItem: PetUserItem) => {
            // const prefix: string = Util.leftZeroPad(petUserItem.pet_item.item_id.toString(), 64);
            const prefix: string = petUserItem.pet_item.item_id.toString();
            (
              petUserItem.pet_item as any
            ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
            (
              petUserItem.pet_item as any
            ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;
            (petUserItem.pet_item as any).quantity = petUserItem.quantity;

            delete petUserItem.pet_item.air;
            delete petUserItem.pet_item.fire;
            delete petUserItem.pet_item.water;
            delete petUserItem.pet_item.grass;

            data.push(petUserItem.pet_item);
          });
        }
        return { total, user: owner, data };
      } else {
        // Figure out our options without filtering by owner
        const options: FindManyOptions<PetItem> = {
          take: limit,
          skip: skip,
          relations: ['pet_type', 'pet_type.pet_category'],
        };
        const [petItems, total] = await petItemRepo.findAndCount(options);
        if (petItems) {
          petItems.forEach((petItem: PetItem) => {
            // const prefix: string = Util.leftZeroPad(petItem.item_id.toString(), 64);
            const prefix: string = petItem.item_id.toString();
            (
              petItem as any
            ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
            (
              petItem as any
            ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;

            delete petItem.air;
            delete petItem.fire;
            delete petItem.grass;
            delete petItem.water;
          });
        }

        const toRet = {
          total,
          data: petItems,
        };

        // Cache our page for 5 seconds
        await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

        return toRet;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async findOne(id: number) {
    // Page caching
    let qSig = `item-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const petItem = await getRepository<PetItem>(PetItem).findOne({
      where: {
        item_id: id,
      },
    });
    if (petItem) {
      const prefix: string = petItem.item_id.toString();
      (
        petItem as any
      ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
      (
        petItem as any
      ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;

      delete petItem.air;
      delete petItem.fire;
      delete petItem.grass;
      delete petItem.water;

      const toRet = petItem;

      // Cache our page for 5 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

      return toRet;
    } else {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
  }

  update(id: number, updateItemDto: UpdateItemDto) {
    return `This action updates a #${id} item`;
  }

  remove(id: number) {
    return `This action removes a #${id} item`;
  }
}
