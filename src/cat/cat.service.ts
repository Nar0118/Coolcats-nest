/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { DatabaseService } from '../database.service';
import { Connection, getRepository, Repository } from 'typeorm';
import { Coolcats } from '../entity/coolcats';
import { CoolcatOwner } from '../entity/coolcat-owner';
import { BlockchainContract } from '../entity/blockchain-contract';
import { EMode, Environment } from '../environment';
import { Util } from '../util';

@Injectable()
export class CatService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  async findAll(query: any) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `cat-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    try {
      const conn: Connection = await this.databaseService.connection;
      const blockchainContractRepository: Repository<BlockchainContract> =
        conn.getRepository(BlockchainContract);
      const blockchainContract: BlockchainContract =
        await blockchainContractRepository.findOne({
          where: {
            code: 'COOLCAT_721',
            mode: Environment.env.MODE,
          },
        });

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

      const queryBuilder = getRepository(Coolcats)
        .createQueryBuilder('cat')
        .take(limit)
        .skip(skip);

      // Filter according to traits
      const traitQueries = [];

      if (
        query.body ||
        query.shirt ||
        query.hats ||
        query.face ||
        query.tier ||
        query.ids
      ) {
        if (query.body) {
          traitQueries.push({ body: query.body });
        }
        if (query.shirt) {
          traitQueries.push({ shirt: query.shirt });
        }
        if (query.hats) {
          traitQueries.push({ hats: query.hats });
        }
        if (query.face) {
          traitQueries.push({ face: query.face });
        }
        if (query.tier) {
          traitQueries.push({ tier: query.tier });
        }
        if (query.ids) {
          const ids: number[] = query.ids.split(',');
          traitQueries.push({ token_ids: ids });
        }

        for (let i = 0; i < traitQueries.length; i++) {
          if (Object.keys(traitQueries[i])[0] === 'token_ids') {
            queryBuilder.andWhere(
              'token_id IN (:...token_ids)',
              traitQueries[i],
            );
          } else {
            queryBuilder.andWhere(
              `${Object.keys(traitQueries[i])[0]} = :${
                Object.keys(traitQueries[i])[0]
              }`,
              traitQueries[i],
            );
          }
        }
      }

      // We may need to grab the IDs of cats owned by a particular individual
      if (query.owner) {
        const ownerRepository = getRepository<CoolcatOwner>(CoolcatOwner);
        const results = await ownerRepository.find({
          select: ['token_id'],
          where: {
            to: query.owner,
            blockchainContract,
          },
        });
        const ids: number[] = results.map((val) => {
          return val.token_id;
        });

        if (ids.length !== 0) {
          queryBuilder.andWhere('token_id IN (:...tokenIds)', {
            tokenIds: ids,
          });
        } else {
          queryBuilder.andWhere('1=0');
        }
      }

      if (query.sortBy) {
        let sortBy: string = query.sortBy;
        let dir: 'ASC' | 'DESC' = 'ASC';

        const underscoreLoc: number = query.sortBy.lastIndexOf('_');
        if (underscoreLoc >= 0) {
          const candidate: string = query.sortBy
            .substr(underscoreLoc + 1)
            .toUpperCase();
          if (candidate === 'DESC') {
            dir = 'DESC';
          }
          if (candidate === 'DESC' || candidate === 'ASC') {
            sortBy = query.sortBy.substring(0, underscoreLoc);
          }
        }

        if (sortBy === 'tier') {
          if (dir === 'ASC') {
            queryBuilder.orderBy(
              `(case when tier = 'cool_1' then 1 when tier = 'cool_2' then 2 when tier = 'wild_1' then 3 when tier = 'wild_2' then 4 when tier = 'classy_1' then 5 when tier = 'classy_2' then 6 when tier = 'exotic_1' then 7 when tier = 'exotic_2' then 8 else null end)`,
            );
          } else {
            queryBuilder.orderBy(
              `(case when tier = 'cool_1' then 8 when tier = 'cool_2' then 7 when tier = 'wild_1' then 6 when tier = 'wild_2' then 5 when tier = 'classy_1' then 4 when tier = 'classy_2' then 3 when tier = 'exotic_1' then 2 when tier = 'exotic_2' then 1 else null end)`,
            );
          }
        } else {
          queryBuilder.orderBy(sortBy, dir);
        }
      }

      // Hit the database to grab the cats !
      const [result, total] = await queryBuilder.getManyAndCount();

      // const [result, total] = await catRepository.findAndCount(options);

      // Transform the data to meet client spec
      result.forEach((val) => {
        (val as any).attributes = [
          { trait_type: 'body', value: val.body },
          { trait_type: 'hats', value: val.hats },
          { trait_type: 'shirt', value: val.shirt },
          { trait_type: 'face', value: val.face },
          { trait_type: 'tier', value: val.tier },
        ];
        delete val.body;
        delete val.hats;
        delete val.shirt;
        delete val.face;
        delete val.tier;
        (val as any).points = {
          body: val.body_points,
          shirt: val.shirt_points,
          hats: val.hats_points,
          face: val.face_points,
        };
        delete val.body_points;
        delete val.shirt_points;
        delete val.hats_points;
        delete val.face_points;

        delete val.id;

        switch (Environment.env.MODE) {
          case EMode.PROD:
            (val as any).image = val.ipfs_image;
            break;
          case EMode.DEV:
            (
              val as any
            ).image = `${Environment.env.METADATA_PATH}beta-cats/${val.token_id}_thumbnail.png`;
            break;
          case EMode.BETA:
            (
              val as any
            ).image = `${Environment.env.METADATA_PATH}beta-cats/${val.token_id}_thumbnail.png`;
            break;
          default:
            (
              val as any
            ).image = `${Environment.env.METADATA_PATH}beta-cats/${val.token_id}_thumbnail.png`;
        }

        delete val.ipfs_image;
        delete val.google_image;
      });

      const toRet = {
        data: result,
        total: total,
        limit: limit,
      };

      // Cache our page for 5 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

      // Return our results
      return toRet;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async findOne(id: number) {
    // Page caching
    const qSig = `cat-findOne-${id}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    const catRepository = getRepository<Coolcats>(Coolcats);
    const coolcat: Coolcats = await catRepository.findOne({
      where: {
        token_id: id,
      },
    });

    if (coolcat) {
      (coolcat as any).attributes = [
        { trait_type: 'body', value: coolcat.body },
        { trait_type: 'hats', value: coolcat.hats },
        { trait_type: 'shirt', value: coolcat.shirt },
        { trait_type: 'face', value: coolcat.face },
        { trait_type: 'tier', value: coolcat.tier },
      ];
      delete coolcat.body;
      delete coolcat.hats;
      delete coolcat.shirt;
      delete coolcat.face;
      delete coolcat.tier;
      (coolcat as any).points = {
        body: coolcat.body_points,
        shirt: coolcat.shirt_points,
        hats: coolcat.hats_points,
        face: coolcat.face_points,
      };
      delete coolcat.body_points;
      delete coolcat.shirt_points;
      delete coolcat.hats_points;
      delete coolcat.face_points;

      delete coolcat.id;

      switch (Environment.env.MODE) {
        case EMode.PROD:
          (coolcat as any).image = coolcat.ipfs_image;
          break;
        case EMode.DEV:
          (
            coolcat as any
          ).image = `${Environment.env.METADATA_PATH}beta-cats/${coolcat.token_id}_thumbnail.png`;
          break;
        case EMode.BETA:
          (
            coolcat as any
          ).image = `${Environment.env.METADATA_PATH}beta-cats/${coolcat.token_id}_thumbnail.png`;
          break;
        default:
          (
            coolcat as any
          ).image = `${Environment.env.METADATA_PATH}beta-cats/${coolcat.token_id}_thumbnail.png`;
      }

      delete coolcat.ipfs_image;
      delete coolcat.google_image;

      const toRet = {
        data: coolcat,
      };

      // Cache our page for 5 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 5000);

      // Return our results
      return toRet;
    } else {
      throw new NotFoundException();
    }
  }

  update(id: number, updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  remove(id: number) {
    return `This action removes a #${id} cat`;
  }
}
