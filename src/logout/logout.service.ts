/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Injectable } from '@nestjs/common';
import { CreateLogoutDto } from './dto/create-logout.dto';
import { UpdateLogoutDto } from './dto/update-logout.dto';
import { Environment } from '../environment';
import { Response } from 'express';

@Injectable()
export class LogoutService {
  create(createLogoutDto: CreateLogoutDto, res: Response) {
    const cookie = `Authentication=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure;`;
    res.setHeader('Set-Cookie', cookie);
    return { status: 'ok', loggedIn: false };
  }

  findAll() {
    return `This action returns all logout`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logout`;
  }

  update(id: number, updateLogoutDto: UpdateLogoutDto) {
    return `This action updates a #${id} logout`;
  }

  remove(id: number) {
    return `This action removes a #${id} logout`;
  }
}
