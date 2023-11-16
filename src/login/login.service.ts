/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateLoginDto } from './dto/create-login.dto';
import { UpdateLoginDto } from './dto/update-login.dto';
import { DatabaseService } from '../database.service';
import { Connection, getManager, getRepository } from 'typeorm';
import { User } from '../entity/user';
import { IRateLimitRule, Util } from '../util';
import { UserProperty } from '../entity/user-property';
import { Nonce } from '../entity/nonce';
import { Request, Response } from 'express';
import { Environment } from '../environment';
import { ethers } from 'ethers';
import { ERateLimitPageKey } from '../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const JWT = require('jsonwebtoken');

export interface IUserProperty {
  key: string;
  value: string;
}

@Injectable()
export class LoginService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createLoginDto: CreateLoginDto, req: Request, res: Response) {
    const clientIpKey: string = await Util.redisGet(createLoginDto.nonce);
    if (!clientIpKey) {
      throw new BadRequestException('Invalid nonce value');
    } else {
      // Prevents replay attacks
      await Util.redisDel(clientIpKey);
      await Util.redisDel(createLoginDto.nonce);
    }

    /*
    const conn: Connection = await this.databaseService.connection;
    
    // Validate our nonce and prevent replay attacks
    try {
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        const nonce: Nonce = await transactionalEntityManager.createQueryBuilder(Nonce, 'nonce')
          .setLock('pessimistic_read')
          .where({ nonce: createLoginDto.nonce })
          .getOne();
        if (nonce) {
          // Nonce exists, we can delete it to prevent the replay attack
          await transactionalEntityManager.remove<Nonce>(nonce);
        } else {
          throw new BadRequestException('Invalid nonce value');
        }
      });
    } catch (error) {
      // Would happen on concurrent attempts to hit the endpoint with the same nonce
      throw new BadRequestException('Invalid nonce value');
    }
    */

    // Check the signed nonce to make sure the user signed the login attempt (if in an environment
    // where this check is desired)
    let recoveredAddress: string | undefined;
    try {
      const message = `Welcome to Cool Cats!\n\nClick to login to Cool Cats site and accept our \nTerms of Service:\n\nhttps://www.coolcatsnft.com/terms\n\nThis will not trigger a blockchain transaction \nor incur any fees.\n\nWallet address:\n${createLoginDto.address.toLowerCase()}\n\nNonce:\n${
        createLoginDto.nonce
      }`;
      recoveredAddress = ethers.utils.verifyMessage(
        message,
        createLoginDto.signature,
      );
    } catch (err) {
      recoveredAddress = undefined;
    }
    if (
      !recoveredAddress ||
      (recoveredAddress as string).toUpperCase() !==
        createLoginDto.address.toUpperCase()
    ) {
      throw new BadRequestException(
        `Invalid Signature - ${createLoginDto.address} ${createLoginDto.nonce} ${createLoginDto.signature}`,
      );
    }

    const walletRateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.LOGIN,
      createLoginDto.address,
    );
    if (walletRateLimited) {
      throw new HttpException('This wallet is rate limited.', 429);
    }

    await Util.mustHavePetOrCat(createLoginDto.address);

    // ----------------------------------------------------
    // The account passed is a valid account and was signed
    // ----------------------------------------------------

    // Set up our database stuff
    const userRepository = getRepository<User>(User);
    const userPropRepository = getRepository<UserProperty>(UserProperty);

    // See if we already have an account with Cool Cats, if so use it.
    let user: User = await userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.user_properties', 'userProperties')
      .where(`LOWER(u.account) = LOWER(:acnt)`, {
        acnt: createLoginDto.address,
      })
      .getOne();
    if (user) {
      user.last_login = Util.mysqlFromDate(new Date());
      await userRepository.save(user);
    } else {
      user = new User();
      user.account = createLoginDto.address;
      user.created = user.last_login = Util.mysqlFromDate(new Date());
      await userRepository.save(user);
    }

    const payload: any = await Util.getUserRecord(null, user);

    // Send down the HTTP Only cookie
    const jwt = JWT.sign(
      {
        exp:
          Math.floor(Date.now() / 1000) +
          Environment.env.JWT_EXPIRATION_TIME_SECS,
        data: user.account,
      },
      Environment.env.JWT_SECRET,
    );
    const cookie = `Authentication=${jwt}; HttpOnly; Path=/; Max-Age=${Environment.env.JWT_EXPIRATION_TIME_SECS}; SameSite=None; Secure;`;
    res.setHeader('Set-Cookie', cookie);

    // Add JWT to payload if we are an iPhone
    // Detect iPhone
    let isIphone = false;
    req.rawHeaders.forEach((val: string, index: number) => {
      if (val.toLowerCase() === 'user-agent') {
        if (req.rawHeaders[index + 1]) {
          const userAgent: string = req.rawHeaders[index + 1];
          if (
            userAgent.indexOf('iPhone') >= 0 ||
            userAgent.indexOf('Mobile') >= 0
          ) {
            isIphone = true;
          }
        }
      }
    });
    if (isIphone) {
      payload.coolcatValidation = jwt;
    }

    // Return our payload
    return payload;
  }

  findAll() {
    return `This action returns all login`;
  }

  findOne(id: number) {
    return `This action returns a #${id} login`;
  }

  update(id: number, updateLoginDto: UpdateLoginDto) {
    return `This action updates a #${id} login`;
  }

  remove(id: number) {
    return `This action removes a #${id} login`;
  }
}
