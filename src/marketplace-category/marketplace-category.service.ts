import { Injectable } from '@nestjs/common';
import { CreateMarketplaceCategoryDto } from './dto/create-marketplace-category.dto';
import { UpdateMarketplaceCategoryDto } from './dto/update-marketplace-category.dto';
import { getRepository, Repository } from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { PetCategory } from '../entity/pet-category';
import { Util } from '../util';

@Injectable()
export class MarketplaceCategoryService {
  create(createMarketplaceCategoryDto: CreateMarketplaceCategoryDto) {
    return 'This action adds a new marketplaceCategory';
  }

  async findAll() {
    // Page caching
    const qSig = `marketplaceCategory-findAll`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const itemCategoryRepo: Repository<PetCategory> =
      getRepository<PetCategory>(PetCategory);

    try {
      const options: FindManyOptions<PetCategory> = {
        relations: ['pet_types'],
      };

      const categories = await itemCategoryRepo.find(options);

      const toRet = {
        data: categories,
      };

      // Cache our page for 60 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 60000);

      return toRet;
    } catch (error) {
      console.log(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} marketplaceCategory`;
  }

  update(
    id: number,
    updateMarketplaceCategoryDto: UpdateMarketplaceCategoryDto,
  ) {
    return `This action updates a #${id} marketplaceCategory`;
  }

  remove(id: number) {
    return `This action removes a #${id} marketplaceCategory`;
  }
}
