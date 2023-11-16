import { Injectable, Query, Req } from '@nestjs/common';
import { CreateIsConnectedDto } from './dto/create-is-connected.dto';
import { UpdateIsConnectedDto } from './dto/update-is-connected.dto';
import { Util } from '../../util';

@Injectable()
export class IsConnectedService {
  create(createIsConnectedDto: CreateIsConnectedDto) {
    return 'This action adds a new isConnected';
  }

  async findAll(@Req() req) {
    return {
      isConnected: await Util.isUserConnected((req as any).ethAddress),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} isConnected`;
  }

  update(id: number, updateIsConnectedDto: UpdateIsConnectedDto) {
    return `This action updates a #${id} isConnected`;
  }

  remove(id: number) {
    return `This action removes a #${id} isConnected`;
  }
}
