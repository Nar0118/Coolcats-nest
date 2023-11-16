import { Injectable, Req } from '@nestjs/common';
import { CreateNextClaimTimeDto } from './dto/create-next-claim-time.dto';
import { UpdateNextClaimTimeDto } from './dto/update-next-claim-time.dto';
import { Util } from '../../util';
import { Request } from 'express';

@Injectable()
export class NextClaimTimeService {
  create(createNextClaimTimeDto: CreateNextClaimTimeDto) {
    return 'This action adds a new nextClaimTime';
  }

  async findAll(@Req() req: Request) {
    const account: string = (req as any).ethAddress;
    const nextClaimTime: number = await Util.getNextClaimTime(account);
    const friendlyNextClaimTime: string = new Date(
      1000 * nextClaimTime,
    ).toString();
    const inLaunchMode = await Util.inLaunchMode();
    return {
      nextClaimTime,
      friendlyNextClaimTime,
      inLaunchMode,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} nextClaimTime`;
  }

  update(id: number, updateNextClaimTimeDto: UpdateNextClaimTimeDto) {
    return `This action updates a #${id} nextClaimTime`;
  }

  remove(id: number) {
    return `This action removes a #${id} nextClaimTime`;
  }
}
