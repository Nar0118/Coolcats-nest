import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateListingFeeDto } from './dto/create-listing-fee.dto';
import { UpdateListingFeeDto } from './dto/update-listing-fee.dto';
import { ethers } from 'ethers';
import { getRepository, Repository } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { Util } from '../../util';
import { ERedisKey } from '../../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class ListingFeeService {
  create(createListingFeeDto: CreateListingFeeDto) {
    return 'This action adds a new listingFee';
  }

  async findAll(@Query() query) {
    // Page caching
    let qSig: string = Util.querySignature(query);
    qSig = `listingFee-findAll-${qSig}`;
    const cachedPage: string = await Util.redisGet(qSig);
    if (cachedPage) {
      const toRet: any = JSON.parse(cachedPage);
      toRet.cached = true;
      return toRet;
    }

    if (query.price) {
      if (isNaN(query.price)) {
        throw new BadRequestException(
          `'${query.price}' is not a valid value for the price parameter`,
        );
      }

      const price = ethers.utils.parseUnits(query.price.toString(), 'ether');
      const feeBp = await this.getListingFeeBasisPoints();

      const feeAmount = price.mul(feeBp).div(10000);
      const feeAmountEther = ethers.utils.formatEther(feeAmount);

      const toRet = {
        fee: feeAmountEther,
        price: query.price,
      };

      // Cache our page for 30 seconds
      await Util.redisSet(qSig, JSON.stringify(toRet), 30000);

      return toRet;
    } else {
      throw new BadRequestException("Missing parameter 'price'");
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} listingFee`;
  }

  update(id: number, updateListingFeeDto: UpdateListingFeeDto) {
    return `This action updates a #${id} listingFee`;
  }

  remove(id: number) {
    return `This action removes a #${id} listingFee`;
  }

  async getListingFeeBasisPoints() {
    const listingFeeString = await Util.redisGet(
      ERedisKey.LISTING_FEE_BASIS_POINTS,
    );
    if (listingFeeString) {
      return parseInt(listingFeeString);
    }

    // Create instance of the MARKETPLACE contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract =
      await blockchainContractRepository.findOne({
        where: {
          code: 'MARKETPLACE',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      let web3: any;
      const providers: string[] = blockchainContract.provider.split('|');
      const provider: string = providers[0];
      if (provider.indexOf('wss') >= 0) {
        web3 = new Web3(
          new Web3.providers.WebsocketProvider(provider, {
            clientConfig: {
              maxReceivedFrameSize: 100000000,
              maxReceivedMessageSize: 100000000,
            },
          }),
        );
      } else {
        web3 = new Web3(
          new Web3.providers.HttpProvider(provider, {
            clientConfig: {
              maxReceivedFrameSize: 100000000,
              maxReceivedMessageSize: 100000000,
            },
          }),
        );
      }

      // Grab ABI
      const abi: any = JSON.parse(
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      const feeBp = await contract.methods._saleFeeBp().call();

      // Cache the value for 60 seconds
      await Util.redisSet(ERedisKey.LISTING_FEE_BASIS_POINTS, feeBp, 900_000);

      return parseInt(feeBp);
    } else {
      throw new BadRequestException(
        `Could not find blockchain contract ${Environment.env.MODE}/MARKETPLACE`,
      );
    }
  }
}
