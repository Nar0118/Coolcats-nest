import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ethers } from 'ethers';
import { Util } from '../util';
import { Action } from 'src/entity/action';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

@Injectable()
export class ProductService {
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAll() {
    const key = `box-price`;
    let product = await Util.redisGet(key);
    if (product) {
      return product;
    }

    const boxPrice: string = await Util.getBoxPrice();
    const actions: Action[] = await Util.getActiveActions();

    const toRet = [
      {
        id: 1,
        name: 'Pet Supplies',
        cost: ethers.utils.formatEther(boxPrice),
      },
      actions,
    ];

    await Util.redisSet(key, JSON.stringify(toRet), 5_000);
    return toRet;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
