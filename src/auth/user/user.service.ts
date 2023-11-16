/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../entity/user';
import { getRepository } from 'typeorm';
import { UserProperty } from '../../entity/user-property';
import { IUserProperty } from '../../login/login.service';
import { Util } from '../../util';

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll(req) {
    try {
      const payload: any = await Util.getUserRecord((req as any).ethAddress);

      payload.rateLimitedPages = await Util.getRateLimitedDetails(
        (req as any).clientIp,
      );
      payload.systemTime = new Date().toISOString();

      return payload;
    } catch (err) {
      throw new NotFoundException();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
