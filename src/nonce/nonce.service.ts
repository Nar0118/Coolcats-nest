/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Injectable } from '@nestjs/common';
import { CreateNonceDto } from './dto/create-nonce.dto';
import { UpdateNonceDto } from './dto/update-nonce.dto';
import { DatabaseService } from '../database.service';
import { Nonce } from '../entity/nonce';
import { Connection, getRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Util } from '../util';
import { ethers } from 'ethers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SHA256 = require('crypto-js/sha256');

@Injectable()
export class NonceService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createNonceDto: CreateNonceDto) {
    return 'This action adds a new nonce';
  }

  /**
   * Method will generate a nonce for a given IP address
   */
  async findAll(req, query) {
    const clientIpKey = `NONCE-${req.clientIp}`;
    let nonce: string = await Util.redisGet(clientIpKey);
    if (!nonce) {
      nonce = uuidv4();
      await Util.redisSet(clientIpKey, nonce, 60000);
      await Util.redisSet(nonce, clientIpKey, 60000);
    }
    return { nonce };

    /*
    const conn: Connection = await this.databaseService.connection;
    const nonceRepository = getRepository<Nonce>(Nonce);
    
    // See if there is an outstanding nonce for the IP address
    let nonce: Nonce[];
    if (req.clientIp) {
      nonce = await nonceRepository.find({
        where: {
          ip_address: req.clientIp
        }
      });
    }
    
    if (nonce && nonce.length === 1) {
      return { nonce: nonce[0].nonce };
    } else {
      const newNonce: Nonce = new Nonce();
      newNonce.timestamp = Util.mysqlFromDate(new Date());
      if (req.clientIp) {
        newNonce.ip_address = req.clientIp
      }
      newNonce.nonce = uuidv4();
      
      await nonceRepository.save(newNonce);
      
      // Return a UINT256 version of the nonce to use for system signing method
      const uint256: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(newNonce.nonce)).substr(2);
      return { nonce: newNonce.nonce, uint256};
    }
    */
  }

  findOne(id: number) {
    return `This action returns a #${id} nonce`;
  }

  update(id: number, updateNonceDto: UpdateNonceDto) {
    return `This action updates a #${id} nonce`;
  }

  remove(id: number) {
    return `This action removes a #${id} nonce`;
  }
}
