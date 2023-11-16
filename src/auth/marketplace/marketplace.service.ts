import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMarketplaceDto } from './dto/create-marketplace.dto';
import { UpdateMarketplaceDto } from './dto/update-marketplace.dto';
import { MarketplaceListing } from '../../entity/marketplace-listing';
import {
  getRepository,
  In,
  IsNull,
  Like,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Environment } from '../../environment';
import { Util } from '../../util';

@Injectable()
export class MarketplaceService {
  create(createMarketplaceDto: CreateMarketplaceDto) {
    return 'This action adds a new marketplace';
  }

  async findAll(query: any) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `marketplace-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const mpRepo = getRepository<MarketplaceListing>(MarketplaceListing);

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
      const options: FindManyOptions<MarketplaceListing> = {
        take: limit,
        skip: skip,
        relations: [
          'user',
          'pet_item',
          'pet_item.pet_type',
          'pet_item.pet_type.pet_category',
        ],
      };

      if (query.sortBy) {
        let sortBy: string = query.sortBy;
        let dir = 'ASC';

        const underscoreLoc: number = query.sortBy.indexOf('_');

        if (underscoreLoc >= 0) {
          const candidate: string = query.sortBy
            .substr(underscoreLoc + 1)
            .toUpperCase();
          if (candidate === 'HIGH_LOW') {
            dir = 'DESC';
          }
          if (candidate === 'HIGH_LOW' || candidate === 'LOW_HIGH') {
            sortBy = query.sortBy.substr(0, underscoreLoc);
          }
        }
        options.order = {};
        options.order[sortBy] = dir;
      }

      if (query?.status?.toLowerCase() === 'removed') {
        // Filter by user AND removed
        options.where = {
          user: { account: owner },
          remove_timestamp: MoreThan(new Date('2022-01-01 00:00:00')),
        };
      } else if (query?.status?.toLowerCase() === 'purchased') {
        // Filter just by user and purchased
        options.where = {
          user: { account: owner },
          buyer: Not(''),
        };
      } else {
        // only active listings
        options.where = {
          user: { account: owner },
          remove_timestamp: IsNull(),
        };
      }

      if (query.term) {
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        options.where.pet_item.name = Like(`%${query.term}%`);
      }

      if (query.category) {
        const categories: number[] = query.category.split(',');
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        if (!options.where.pet_item.pet_type) {
          options.where.pet_item.pet_type = {};
        }
        if (!options.where.pet_item.pet_type.pet_category) {
          options.where.pet_item.pet_type.pet_category = {};
        }

        options.where.pet_item.pet_type.pet_category.id = In(categories);
      }

      if (query.types) {
        const types: number[] = query.types.split(',');
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        if (!options.where.pet_item.pet_type) {
          options.where.pet_item.pet_type = {};
        }

        options.where.pet_item.pet_type.id = In(types);
      }

      // Add itemIds to the where filter if specified on the query string
      if (query.itemIds) {
        const ids: number[] = Util.validateIdListParameter(query.itemIds);
        if (!ids) {
          throw new BadRequestException(
            `itemIds parameter must be an array of valid item ids`,
          );
        }
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }

        options.where.pet_item.item_id = In(ids);
      }

      // Listings for a particular owner
      const data = new Array<any>();
      const [listings, total] = await mpRepo.findAndCount(options);
      if (listings) {
        listings.forEach((listing: MarketplaceListing) => {
          // We do not want to expose these
          delete listing.pet_item.air;
          delete listing.pet_item.grass;
          delete listing.pet_item.water;
          delete listing.pet_item.air;

          const prefix: string = listing.pet_item.item_id.toString();
          (
            listing.pet_item as any
          ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
          (
            listing.pet_item as any
          ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;
          data.push(listing);
        });
      }

      const toRet = {
        total,
        user: owner,
        data,
      };

      // Cache our page for 3 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 3000);

      return toRet;
    } else {
      // Figure out our options without filtering by owner
      const options: FindManyOptions<MarketplaceListing> = {
        take: limit,
        skip: skip,
        relations: [
          'pet_item',
          'pet_item.pet_type',
          'pet_item.pet_type.pet_category',
        ],
      };

      if (query.sortBy) {
        let sortBy: string = query.sortBy;
        let dir = 'ASC';

        const underscoreLoc: number = query.sortBy.indexOf('_');

        if (underscoreLoc >= 0) {
          const candidate: string = query.sortBy
            .substr(underscoreLoc + 1)
            .toUpperCase();
          if (candidate === 'HIGH_LOW') {
            dir = 'DESC';
          }
          if (candidate === 'HIGH_LOW' || candidate === 'LOW_HIGH') {
            sortBy = query.sortBy.substr(0, underscoreLoc);
          }
        }
        options.order = {};
        options.order[sortBy] = dir;
      }

      // Deal with status
      if (query?.status?.toLowerCase() === 'removed') {
        // Filter by user AND removed
        options.where = {
          remove_timestamp: MoreThan(new Date('2022-01-01 00:00:00')),
        };
      } else if (query?.status?.toLowerCase() === 'purchased') {
        // Filter just by user and purchased
        options.where = {
          buyer: Not(''),
        };
      } else {
        // only active listings
        options.where = {
          remove_timestamp: IsNull(),
        };
      }

      if (query.term) {
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        options.where.pet_item.name = Like(`%${query.term}%`);
      }

      if (query.category) {
        const categories: number[] = query.category.split(',');
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        if (!options.where.pet_item.pet_type) {
          options.where.pet_item.pet_type = {};
        }
        if (!options.where.pet_item.pet_type.pet_category) {
          options.where.pet_item.pet_type.pet_category = {};
        }

        options.where.pet_item.pet_type.pet_category.id = In(categories);
      }

      if (query.types) {
        const types: number[] = query.types.split(',');
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }
        if (!options.where.pet_item.pet_type) {
          options.where.pet_item.pet_type = {};
        }

        options.where.pet_item.pet_type.id = In(types);
      }

      // Add itemIds to the where filter if specified on the query string
      if (query.itemIds) {
        const ids: number[] = Util.validateIdListParameter(query.itemIds);
        if (!ids) {
          throw new BadRequestException(
            `itemIds parameter must be an array of valid item ids`,
          );
        }
        if (!options.where) {
          options.where = {};
        }
        if (!options.where.pet_item) {
          options.where.pet_item = {};
        }

        options.where.pet_item.item_id = In(ids);
      }

      const [listings, total] = await mpRepo.findAndCount(options);
      if (listings) {
        listings.forEach((listing: MarketplaceListing) => {
          // const prefix: string = Util.leftZeroPad(petItem.item_id.toString(), 64);
          const prefix: string = listing.pet_item.item_id.toString();
          (
            listing as any
          ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
          (
            listing as any
          ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;

          delete listing.pet_item.air;
          delete listing.pet_item.grass;
          delete listing.pet_item.water;
          delete listing.pet_item.air;
        });
      }

      const toRet = {
        total,
        data: listings,
      };

      // Cache our page for 3 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 3000);

      return toRet;
    }
  }

  async findOne(id: number) {
    // Page caching
    const qSig = `marketplace-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const listing = await getRepository<MarketplaceListing>(
      MarketplaceListing,
    ).findOne({
      where: {
        listingId: id,
      },
      relations: [
        'pet_item',
        'pet_item.pet_type',
        'pet_item.pet_type.pet_category',
      ],
    });

    if (listing) {
      const prefix: string = listing.pet_item.item_id.toString();
      (
        listing as any
      ).image = `${Environment.env.METADATA_PATH}item/image/${prefix}.png`;
      (
        listing as any
      ).metadata = `${Environment.env.METADATA_PATH}item/metadata/${prefix}.json`;

      delete listing.pet_item.air;
      delete listing.pet_item.grass;
      delete listing.pet_item.water;
      delete listing.pet_item.air;

      // Cache our page for 3 seconds
      await Util.redisSet(qSig, JSON.stringify(listing), 3000);

      return listing;
    } else {
      throw new NotFoundException(`Marketplace listingId not found`);
    }
  }

  update(id: number, updateMarketplaceDto: UpdateMarketplaceDto) {
    return `This action updates a #${id} marketplace`;
  }

  remove(id: number) {
    return `This action removes a #${id} marketplace`;
  }
}
