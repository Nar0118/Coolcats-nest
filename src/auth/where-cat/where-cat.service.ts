import { Injectable } from '@nestjs/common';
import { CreateWhereCatDto } from './dto/create-where-cat.dto';
import { UpdateWhereCatDto } from './dto/update-where-cat.dto';

@Injectable()
export class WhereCatService {
  create(createWhereCatDto: CreateWhereCatDto) {
    return { status: 'OK' };
  }

  findAll() {
    return `This action returns all whereCat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} whereCat`;
  }

  update(id: number, updateWhereCatDto: UpdateWhereCatDto) {
    return `This action updates a #${id} whereCat`;
  }

  remove(id: number) {
    return `This action removes a #${id} whereCat`;
  }
}
