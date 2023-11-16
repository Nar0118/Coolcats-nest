import { Injectable, Query } from '@nestjs/common';
import { CreateListContractDto } from './dto/create-list-contract.dto';
import { UpdateListContractDto } from './dto/update-list-contract.dto';
import { getRepository } from 'typeorm';
import { BlockchainContract } from '../entity/blockchain-contract';
import { Environment } from '../environment';
import { Util } from '../util';

@Injectable()
export class ListContractsService {
  create(createListContractDto: CreateListContractDto) {
    return 'This action adds a new listContract';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `listContracts-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    // abi query string parameter is optional, and if set we will return the ABI, otherwise no ABI is delivered
    if (!query.abi) {
      const [contracts, total] = await getRepository<BlockchainContract>(
        BlockchainContract,
      ).findAndCount({
        where: {
          mode: Environment.env.MODE,
        },
      });

      contracts.forEach((contract) => {
        delete contract.id;
        delete contract.provider;
        delete contract.mode;
        delete contract.run_listener;
        delete contract.next_block;
        delete contract.abi;
        delete contract.token_id;
      });

      const toRet = {
        total,
        data: contracts,
      };

      // Cache our page for 5 minute
      await Util.redisSet(qSig, JSON.stringify(toRet), 300000);

      return toRet;
    } else {
      const [contracts, total] = await getRepository<BlockchainContract>(
        BlockchainContract,
      ).findAndCount({
        where: {
          mode: Environment.env.MODE,
        },
      });

      contracts.forEach((contract) => {
        contract.abi = JSON.parse(
          contract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
        );

        delete contract.id;
        delete contract.provider;
        delete contract.mode;
        delete contract.run_listener;
        delete contract.next_block;
        delete contract.token_id;
      });

      const toRet = {
        total,
        data: contracts,
      };

      // Cache our page for 5 minute
      await Util.redisSet(qSig, JSON.stringify(toRet), 300000);

      return toRet;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} listContract`;
  }

  update(id: number, updateListContractDto: UpdateListContractDto) {
    return `This action updates a #${id} listContract`;
  }

  remove(id: number) {
    return `This action removes a #${id} listContract`;
  }
}
