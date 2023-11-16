/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { DatabaseService } from '../database.service';
import { BaseContract } from '@ethersproject/contracts/src.ts/index';
import { Connection, getRepository } from 'typeorm';
import { BlockchainContract } from '../entity/blockchain-contract';
import { ethers } from 'ethers';
import { BadRequestException } from '@nestjs/common';
import { Environment } from '../environment';
import { SecretsManager } from 'aws-sdk';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

/**
 * Interface describing an ethereum key pair
 */
export interface EthereumAccount {
  publicAddress: string;
  privateKey: string;
}

export class ContractBase {
  protected provider: any;

  constructor(protected readonly databaseService: DatabaseService) {}

  /**
   * Returns our system account private key from AWS secrets manager
   * @protected
   */
  protected async systemAccount(): Promise<EthereumAccount> {
    return new Promise<EthereumAccount>((resolve, reject) => {
      const client: SecretsManager = new AWS.SecretsManager({
        region: Environment.env.AWS_REGION,
      });
      const params: SecretsManager.Types.GetSecretValueRequest = {
        SecretId: Environment.env.AWS_SYSTEM_WALLET_SECRET_NAME,
      };
      client.getSecretValue(params, (err, result) => {
        if (err) {
          if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            reject(err);
          else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            reject(err);
          else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            reject(err);
          else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            reject(err);
          else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            reject(err);
          else {
            reject(err);
          }
        } else {
          // Decrypts secret using the associated KMS CMK.
          // Depending on whether the secret is a string or binary, one of these fields will be populated.
          if ('SecretString' in result) {
            const privateKey: string = result.SecretString as string;
            const systemAccount: EthereumAccount = JSON.parse(
              result.SecretString as string,
            );
            resolve(systemAccount);
          } else {
            reject(new Error('Missing SecretString'));
          }
        }
      });
    });
  }

  /**
   * Factory to create a contract ether.js object from its code in the database
   * @param contractCode
   * @param key
   * @protected
   */
  protected async contractFactory(
    contractCode: string,
    key: EthereumAccount,
  ): Promise<BaseContract> {
    try {
      console.log('----------> 6a');
      const conn: Connection = await this.databaseService.connection;
      const contractRepository =
        getRepository<BlockchainContract>(BlockchainContract);
      const selectedBlockchainContractRecord: BlockchainContract[] =
        await contractRepository.find({
          where: {
            code: contractCode,
          },
        });
      console.log('----------> 6b');
      if (
        selectedBlockchainContractRecord &&
        selectedBlockchainContractRecord.length === 1
      ) {
        // Connect to the blockchain
        const providers: string[] =
          selectedBlockchainContractRecord[0].provider.split('|');
        this.provider = new ethers.providers.JsonRpcProvider(providers[0]);
        console.log(
          `Got provider: ${providers[0]} using account ${key.publicAddress}`,
        );
        const abi: any = JSON.parse(
          selectedBlockchainContractRecord[0].abi
            .toString()
            .replace(/[\u200B-\u200D\uFEFF]/g, ''),
        );
        console.log('----------> 6c');
        const wallet: any = new ethers.Wallet(key.privateKey, this.provider);
        console.log('----------> 6d');
        const contract: any = new ethers.Contract(
          selectedBlockchainContractRecord[0].address,
          abi,
          wallet,
        );
        console.log('----------> 6e');
        // contract.connect(wallet);
        return contract;
      } else {
        throw new BadRequestException(
          `Could not resolve contract ${contractCode}`,
        );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
