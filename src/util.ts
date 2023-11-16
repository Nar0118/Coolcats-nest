/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { getRepository, Repository } from 'typeorm';
import { User } from './entity/user';
import { UserProperty } from './entity/user-property';
import { IUserProperty } from './login/login.service';
import {
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { BlockchainContract } from './entity/blockchain-contract';
import { Environment } from './environment';
import { AWSError, CloudFront, SecretsManager } from 'aws-sdk';
import { PetItem } from './entity/pet-item';
import { PetUserItem } from './entity/pet-user-item';
import { GoldTransaction } from './entity/gold-transaction';
import { createClient } from 'redis';
import { ethers } from 'ethers';
import { PetInteraction } from './entity/pet-interaction';
import { KeyValue } from './entity/key-value';
import { CoolcatOwner } from './entity/coolcat-owner';
import { Whitelist } from './entity/whitelist';
import { v4 as uuidv4 } from 'uuid';
import { CreateInvalidationResult } from 'aws-sdk/clients/cloudfront';
import { ERateLimitPageKey, ERedisKey, Status } from './utility/enums';
import Timeout = NodeJS.Timeout;
import { Action } from './entity/action';

// import Web3 from 'web3'
// import * as AWS from 'aws-sdk'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

export interface IDateWindow {
  startDate: Date;
  endDate: Date;
}

export interface IEthereumAccount {
  publicAddress: string;
  privateKey: string;
}

export interface IRateLimitRule {
  name?: string;
  maxHits: number;
  windowSecs: number;
}

export interface IPageHit {
  hitTimeEpoch: number;
}

export enum ECacheKeys {
  NEXT_MILK_CLAIM = 'next-claim-time',
  MAX_CHAIN_CALLS_DAILY = 'max-chain-calls-daily',
  MUST_HAVE_PET_OR_CAT = 'must-have-pet-or-cat',
  IS_CONNECTED = 'is-user-connected',
  GOLD_BALANCE = 'gold-balance',
}

export const profile = async <T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> => {
  console.time(key);
  const result = await fn();
  console.timeEnd(key);
  return result;
};

export const getWeb3 = (provider: string): any => {
  if (provider.indexOf('wss') >= 0) {
    return new Web3(
      new Web3.providers.WebsocketProvider(provider, {
        clientConfig: {
          maxReceivedFrameSize: 100000000,
          maxReceivedMessageSize: 100000000,
        },
      }),
    );
  } else {
    return new Web3(new Web3.providers.HttpProvider(provider));
  }
};

export class Util {
  private static lastInvalidationCall: number = new Date().getTime();
  public static readonly BLACK_HOLE =
    '0x0000000000000000000000000000000000000000';
  public static isLocalhost: boolean;
  private static redis: any;

  private static localRedis: any = {};

  /**
   * Invalidates cloud front cache for the specified paths on the public metadata server
   * @param paths
   */
  public static invalidateCloudfront(paths: string[], backoffSecs = 0): void {
    // Make sure we are not calling invalidation endpoint at AWS too often, but only on the first time through
    const delta: number = new Date().getTime() - Util.lastInvalidationCall;
    if (delta < 1500) {
      // Resolve the promise and requeue the request in 2 seconds
      setTimeout(async () => {
        Util.invalidateCloudfront(paths, backoffSecs);
      }, 2000);
      return;
    }

    // If we get here, we are calling at the throttled pace
    Util.lastInvalidationCall = new Date().getTime();

    // Create the cloudfront payload
    const cloudfront = new AWS.CloudFront();
    const pngInvalidation: CloudFront.Types.CreateInvalidationRequest = {
      DistributionId: Environment.env.AWS_CLOUDFRONT_DISTRIBUTION,
      InvalidationBatch: {
        CallerReference: uuidv4(),
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    };

    // We are making the call here
    cloudfront.createInvalidation(
      pngInvalidation,
      (err: AWSError, data: CreateInvalidationResult) => {
        if (!err) {
          // TODO Remove this
          paths.forEach((path: string) => {
            // console.log(`======== SUCCESS ======== Invalidated cloudfront for ${path}`);
          });
        } else {
          // Output the error to the console, but still resolve because we want to eat this error
          // if (err && err.code && err.code.toLowerCase() === 'throttling') {

          // We are throttling, so we are going to provide an exponential backoff and then
          // return a resolved promise (because this is not needed to continue to block the caller).
          if (backoffSecs < 3600) {
            let newBackoffSecs: number = backoffSecs;
            if (newBackoffSecs === 0) {
              // First time through do the resolve on the promise
              newBackoffSecs = 5 + Math.floor(5 * Math.random());
            } else {
              // Another exponential backoff
              newBackoffSecs = 2 * newBackoffSecs;
            }

            // We are throttling the request so output warning
            paths.forEach((path: string) => {
              // TODO Notify devops
              console.log(
                `======== WARNING ======== Throttling invalidation for ${path} for ${newBackoffSecs} seconds`,
              );
            });

            // Issue new call to invalidate
            setTimeout(() => {
              Util.invalidateCloudfront(paths, Math.floor(newBackoffSecs));
            }, Math.floor(Math.floor(1000 * newBackoffSecs)));
          } else {
            // If our backoff exceeds 1 hour, give up
            paths.forEach((path: string) => {
              // TODO Notify devops
              console.log(
                `======== ERROR ======== Failed to invalidate ${path}`,
              );
            });
          }
          // } else {
          //   // Unknown error
          //   // TODO Notify devops
          //   console.log(err);
          //
          //   // We do not reject because this is a non-fatal error
          //   resolve(err);
          // }
        }
      },
    );
  }

  /**
   * Forms a mysql formatted string from a javascript date object
   * @param dateIn
   */
  public static mysqlFromDate(dateIn: Date): string {
    const pad = (num: number) => {
      return ('00' + num).slice(-2);
    };
    const toRet: string =
      dateIn.getFullYear() +
      '-' +
      pad(dateIn.getMonth() + 1) +
      '-' +
      pad(dateIn.getDate()) +
      ' ' +
      pad(dateIn.getHours()) +
      ':' +
      pad(dateIn.getMinutes()) +
      ':' +
      pad(dateIn.getSeconds());
    return toRet;
  }

  /**
   * Simple method to get content from a specified URL
   * @param url
   */
  public static async getContent(url): Promise<string> {
    // return new pending promise
    return new Promise((resolve, reject) => {
      // select http or https module, depending on reqested url
      const lib = url.startsWith('https') ? require('https') : require('http');
      const request = lib.get(url, (response) => {
        // handle http errors
        if (response.statusCode < 200 || response.statusCode > 301) {
          reject(
            new Error(
              'Failed to load page, status code: ' + response.statusCode,
            ),
          );
        }
        // temporary data holder
        const body = [];
        // on every content chunk, push it to the data array
        response.on('data', (chunk) => body.push(chunk));
        // we are done, resolve promise with those joined chunks
        response.on('end', () => resolve(body.join('')));
      });
      // handle connection errors of the request
      request.on('error', (err) => reject(err));
    });
  }

  /**
   * Get ItemFactory balance of a user for The Cool Box and Pet items 2-49
   */
  public static async getPetItemAndBoxBalance(address: string) {
    // Grab the blockchain contract record for the QUEST contract
    const itemFactoryContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'ITEM_FACTORY',
          mode: Environment.env.MODE,
        },
      });
    if (!itemFactoryContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'ITEM_FACTORY'",
      );
    }

    // Grab provider
    const providers: string[] = itemFactoryContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      itemFactoryContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      itemFactoryContract.address,
    );

    const addresses = Array(49).fill(address);
    const tokenIds = Array.from({ length: 49 }, (_, i) => i + 1);

    // Get the balance of a user for The Cool Box and Pet items 2-49 from the blockchain (with retry capability)
    const getUserBalances = async (retryCount: number): Promise<any[]> => {
      try {
        return await contractWeb3Instance.methods
          .balanceOfBatch(addresses, tokenIds)
          .call();
      } catch (error) {
        if (retryCount > 0) {
          return await getUserBalances(--retryCount);
        } else {
          return Array(49).fill(0);
        }
      }
    };

    return await getUserBalances(3);
  }

  /**
   * Validates a comma delimited list of numbers and returns as an array of numbers
   * @param commaDelimitedInts
   */
  public static validateIdListParameter(
    commaDelimitedInts: string,
  ): number[] | undefined {
    if (commaDelimitedInts) {
      let allGood = true;
      const asArray: any[] = commaDelimitedInts.split(',');
      const idsAsArrayOfNumbers: number[] = asArray.map((val: any) => {
        const asInt: number = parseInt(val);
        if (isNaN(asInt) || asInt < 0) {
          allGood = false;
          return undefined;
        }
        return asInt;
      });
      return allGood ? idsAsArrayOfNumbers : undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Gets the next claim time as epoch
   * @param address
   */
  public static async getNextClaimTime(address: string): Promise<number> {
    const cacheKey: string = await Util.getUserCacheKey(
      address,
      ECacheKeys.NEXT_MILK_CLAIM,
    );
    let nextClaimTime: number | string = await Util.redisGet(cacheKey);
    if (!nextClaimTime) {
      // Need to generate our nextClaimTime from configuration, we just launched.
      const [launchDateEpochString, launchWindowString, launchWindowEnabled] =
        await Promise.all([
          Util.cachedKeyVal('SYSTEM_CONFIG', 'gameLaunchEpoch', 120000),
          Util.cachedKeyVal('SYSTEM_CONFIG', 'launchWindowSecs', 120000),
          Util.cachedKeyVal('SYSTEM_CONFIG', 'launchWindowEnabled', 120000),
        ]);
      const nowEpoch: number = Math.floor(Date.now() / 1000);
      if (
        launchDateEpochString &&
        launchWindowString &&
        launchWindowEnabled &&
        launchWindowEnabled.toLowerCase() === 'true'
      ) {
        const launchDateEpoch: number = parseInt(launchDateEpochString);
        const launchWindow: number = parseInt(launchWindowString);
        const launchEndEpoch: number = launchDateEpoch + launchWindow;
        if (nowEpoch < launchEndEpoch) {
          // We are in the window
          // Need to create a nextClaimTime at some random time in the future within our window
          const windowRemainingSecs: number =
            nowEpoch > launchDateEpoch
              ? launchEndEpoch - nowEpoch
              : launchWindow;
          nextClaimTime =
            launchEndEpoch - Math.floor(windowRemainingSecs * Math.random());

          // Cache this till the end of the launch window
          const cacheTo: number = launchEndEpoch - nowEpoch;
          await Util.redisSet(
            cacheKey,
            nextClaimTime.toString(),
            cacheTo * 1000,
          );

          // TODO remove
          // console.log(`launchDateEpoch: ${new Date(launchDateEpoch*1000)} launchEndEpoch: ${new Date(1000*launchEndEpoch)}`);
          // console.log(`windowRemaining hours ${windowRemainingSecs/3600} nextClaim: ${new Date(nextClaimTime * 1000)}`);
        } else {
          // Not in the window, so nextClaimTime is now (their first claim)
          // console.log(`219 nextClaimTime: ${new Date(nowEpoch*1000)} launchEndEpoch: ${new Date(1000*nowEpoch)}`);
          nextClaimTime = nowEpoch;
        }
      } else {
        // Simply return now epoch because there was nothing in the cache and
        // we are not checking for launch window
        // console.log(`224 nextClaimTime: ${new Date(nowEpoch*1000)} launchEndEpoch: ${new Date(1000*nowEpoch)}`);
        nextClaimTime = nowEpoch;
      }
    } else {
      // Got it from cache
      nextClaimTime = parseInt(nextClaimTime);
    }

    // Returns our next claim time
    // console.log(`236 nextClaimTime from cache: ${new Date(nextClaimTime*1000)}`);
    return nextClaimTime;
  }

  /**
   * Returns TRUE if the game has launched
   */
  public static async hasGameLaunched(): Promise<boolean> {
    const launchDateEpochString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'gameLaunchEpoch',
      120000,
    );
    if (launchDateEpochString) {
      const launchtDateEpoch: number = parseInt(launchDateEpochString);
      const nowEpochSecs: number = Math.floor(Date.now() / 1000);
      return nowEpochSecs > launchtDateEpoch;
    } else {
      return false;
    }
  }

  /**
   * Returns TRUE if the game has launched
   */
  public static async inLaunchMode(): Promise<boolean> {
    const launchDateEpochString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'gameLaunchEpoch',
      5000,
    );
    const launchWindowString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'launchWindowSecs',
      5000,
    );
    if (launchDateEpochString && launchWindowString) {
      const launchtDateEpoch: number = parseInt(launchDateEpochString);
      const launchtDateEndEpoch: number =
        parseInt(launchDateEpochString) + parseInt(launchWindowString);
      const nowEpochSecs: number = Math.floor(Date.now() / 1000);
      return nowEpochSecs < launchtDateEndEpoch;
    } else {
      return false;
    }
  }

  /**
   * Checks the game has launched and returned 403 if the user is not past their claim time
   */
  public static async checkLaunchModeStatus(address: string): Promise<void> {
    const inLaunchMode: boolean = await Util.inLaunchMode();
    if (!inLaunchMode) {
      return;
    }

    const nextClaimTime: number = await Util.getNextClaimTime(address);
    const nowEpochSecs: number = Math.floor(Date.now() / 1000);
    if (nowEpochSecs < nextClaimTime) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'Cooltopia is in launch mode. You cannot make blockchain calls before your assigned time.',
          assignedTime: nextClaimTime,
          friendlyAssignedTime: new Date(nextClaimTime * 1000).toString(),
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Rate limits polygon requests
   * @param address
   */
  public static async rateLimitChainCalls(
    address: string,
  ): Promise<IRateLimitRule | undefined> {
    // Grab our rule string from the database (return undefined if no rule)
    const ruleString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'chainRateLimitRules',
      60000,
    );
    if (ruleString) {
      const rules = JSON.parse(ruleString);
      const rateLimitRule: IRateLimitRule = await Util.rateLimitPage(
        ERateLimitPageKey.BLOCKCHAIN,
        address,
        rules,
      );
      return rateLimitRule;
    }
    return undefined;

    /*
    const utcDate: Date = Util.utcDate();
    const maxChainCallsDailyString: string = await Util.cachedKeyVal('SYSTEM_CONFIG', 'maxChainCallsDaily', 5000);
    if (maxChainCallsDailyString) {
      let key: string = await Util.getUserCacheKey(address, ECacheKeys.MAX_CHAIN_CALLS_DAILY);
      key = key + '-' + utcDate.getTime();
      const numChainCallsString: string = await Util.redisGet(key);
      let numChainCalls: number = numChainCallsString ? parseInt(numChainCallsString) : 0;
      numChainCalls++;
      if (numChainCalls > parseInt(maxChainCallsDailyString)) {
        return true;
      } else {
        // Cache for a day
        await this.redisSet(key, numChainCalls.toString(), 86400000);
        return false;
      }
    } else {
      return false;
    }
    */
  }

  /**
   * Rate limits
   * @param key
   * @param ttlMillis
   */
  public static async isRateLimitedAndSet(
    key: ERedisKey | string,
    ttlMillis: number,
  ): Promise<boolean> {
    const isLimited: string = await Util.redisGet(key);
    if (isLimited === 'true') {
      return true;
    } else {
      await Util.redisSet(key, 'true', ttlMillis);
      return false;
    }
  }

  /**
   * Check if a user is rate limited
   */
  public static async isRateLimited(key: ERedisKey | string): Promise<boolean> {
    const isLimited: string = await Util.redisGet(key);

    return isLimited === 'true';
  }

  public static async isChainPageRateLimited(
    address: string,
  ): Promise<boolean> {
    const ruleString: string = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'chainRateLimitRules',
      60000,
    );
    if (ruleString) {
      const rules = JSON.parse(ruleString);
      return await Util.isPageRateLimited(
        ERateLimitPageKey.BLOCKCHAIN,
        address,
        rules,
      );
    }
    return false;
  }

  /**
   * Check if a user is rate limited
   */
  public static async isPageRateLimited(
    pageKey: ERateLimitPageKey | string,
    identifier: string,
    rulesOverride?: IRateLimitRule[],
  ): Promise<boolean> {
    // Grab our rule string from the database (return undefined if no rule)
    let rules: IRateLimitRule[];
    if (!rulesOverride) {
      const ruleString: string = await Util.cachedKeyVal(
        'SYSTEM_CONFIG',
        'rateLimitRules',
        60000,
      );
      if (ruleString) {
        rules = JSON.parse(ruleString);
      } else {
        return;
      }
    } else {
      rules = rulesOverride;
    }

    // Calculate our cache key for this page and IP
    let cacheBuster: string | undefined = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'cacheBuster',
      60000,
    );
    if (!cacheBuster) {
      cacheBuster = '';
    }
    const cacheKey = `${pageKey}-${identifier}-${cacheBuster}`;

    // Grab our hit list
    const hitListString: string = await Util.redisGet(cacheKey);
    const hitList: IPageHit[] = hitListString ? JSON.parse(hitListString) : [];

    // Add our current hit to the list
    const nowEpoch: number = Math.floor(Date.now() / 1000);

    // Absolute max no mater what
    const maxHits: string | undefined = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'maxTrackedHits',
      60000,
    );
    if (maxHits && hitList.length > parseInt(maxHits)) {
      return true;
    }

    // Check our hit happening now
    let rateLimit: IRateLimitRule | undefined;
    let longestWindow: number;
    rules.forEach((rule: IRateLimitRule) => {
      let count = 0;
      hitList.forEach((hit: IPageHit) => {
        if (hit.hitTimeEpoch > nowEpoch - rule.windowSecs) {
          // We are in the rule's winidow
          count++;
        }
      });
      if (count > rule.maxHits) {
        // We need to rate limit
        if (!rateLimit) {
          rateLimit = rule;
        }
      }

      // Pick off our longest window as we go here
      if (!longestWindow || rule.windowSecs > longestWindow) {
        longestWindow = rule.windowSecs;
      }
    });

    // Falsy operator
    // https://medium.com/@chirag.viradiya_30404/whats-the-double-exclamation-sign-for-in-javascript-d93ed5ad8491
    // True if defined, false if undefined (or empty string and some other cases)
    return !!rateLimit;
  }

  /**
   * Check is key is rate limited for a user, and return details about the rate limiting if they are
   */
  public static async getRateLimitedDetails(
    identifier: string,
  ): Promise<string[]> {
    const rateLimitedDetails: string[] = [];
    for (const eKey of Object.values(ERateLimitPageKey)) {
      let isLimited: boolean;
      if (eKey === ERateLimitPageKey.BLOCKCHAIN) {
        isLimited = await Util.isChainPageRateLimited(identifier);
      } else {
        isLimited = await Util.isPageRateLimited(eKey, identifier);
      }
      if (isLimited) {
        rateLimitedDetails.push(eKey);
      }
    }

    return rateLimitedDetails;
  }

  /**
   * Return a UTC Date
   */
  public static utcDate(): Date {
    const nowEpoch: number = Math.floor(Date.now() / 1000);
    const now: Date = new Date(1000 * nowEpoch);
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  }

  /**
   * Rate limits a page based on a set of rules from the DB
   * @param pageKey
   *
   * Example rule object
   *      [{ maxHits: 1, windowSecs: 5 }, {maxHits: 5, windowSecs: 60 }]
   * @param identifier
   * @param rulesOverride
   */
  public static async rateLimitPage(
    pageKey: ERateLimitPageKey,
    identifier: string,
    rulesOverride?: IRateLimitRule[],
  ): Promise<IRateLimitRule | undefined> {
    // Grab our rule string from the database (return undefined if no rule)
    let rules: IRateLimitRule[];
    if (!rulesOverride) {
      const ruleString: string = await Util.cachedKeyVal(
        'SYSTEM_CONFIG',
        'rateLimitRules',
        60000,
      );
      if (ruleString) {
        rules = JSON.parse(ruleString);
      } else {
        return;
      }
    } else {
      rules = rulesOverride;
    }

    // Calculate our cache key for this page and IP
    let cacheBuster: string | undefined = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'cacheBuster',
      60000,
    );
    if (!cacheBuster) {
      cacheBuster = '';
    }
    const cacheKey = `${pageKey}-${identifier}-${cacheBuster}`;

    // Grab our hit list
    const hitListString: string = await Util.redisGet(cacheKey);
    const hitList: IPageHit[] = hitListString ? JSON.parse(hitListString) : [];

    // Add our current hit to the list
    const nowEpoch: number = Math.floor(Date.now() / 1000);

    hitList.push({ hitTimeEpoch: nowEpoch });

    // Check our hit happening now
    let rateLimit: IRateLimitRule;
    let longestWindow: number;
    rules.forEach((rule: IRateLimitRule) => {
      let count = 0;
      hitList.forEach((hit: IPageHit) => {
        if (hit.hitTimeEpoch > nowEpoch - rule.windowSecs) {
          // We are in the rule's winidow
          count++;
        }
      });
      if (count > rule.maxHits) {
        // We need to rate limit
        if (!rateLimit) {
          rateLimit = rule;
        }
      }

      // Pick off our longest window as we go here
      if (!longestWindow || rule.windowSecs > longestWindow) {
        longestWindow = rule.windowSecs;
      }
    });

    // Build our updated hitlist
    const newHitList: IPageHit[] = [];

    // Drop our old hits
    hitList.forEach((hit: IPageHit) => {
      if (hit.hitTimeEpoch > nowEpoch - longestWindow) {
        newHitList.push(hit);
      }
    });

    // Absolute max no mater what
    const maxHits: string | undefined = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'maxTrackedHits',
      60000,
    );
    if (maxHits && newHitList.length > parseInt(maxHits)) {
      // Going to rate limit here
      return {
        name: 'maxHits',
        maxHits: parseInt(maxHits),
        windowSecs: 24 * 3600,
      };
    }

    // Save our hit list
    await Util.redisSet(
      cacheKey,
      JSON.stringify(newHitList),
      longestWindow * 1000,
    );

    return rateLimit;
  }

  /**
   * Returns a user specific key for a given prefix
   * @param address
   * @param prefix for key
   */
  public static async getUserCacheKey(
    address: string,
    prefix: ECacheKeys,
  ): Promise<string> {
    let cacheBuster: string | undefined = await Util.cachedKeyVal(
      'SYSTEM_CONFIG',
      'cacheBuster',
      5000,
    );
    if (!cacheBuster) {
      cacheBuster = '';
    }
    return `${prefix}-${cacheBuster}-${address.toLowerCase()}`;
  }

  /**
   * Returns the value for a given key val. Caches for specified millis
   * @param namespace
   * @param key
   * @param cacheMillis
   */
  public static async cachedKeyVal(
    namespace: string,
    key: string,
    cacheMillis,
  ): Promise<string | undefined> {
    const redisKey = `${namespace}-${key}`;
    let val: string | undefined = await Util.redisGet(redisKey);
    if (!val) {
      // Need to get it from the database
      const keyValRepo: Repository<KeyValue> = getRepository(KeyValue);
      const dbValue: KeyValue | undefined = await keyValRepo.findOne({
        where: {
          namespace,
          key,
        },
      });
      val = dbValue ? dbValue.value : undefined;
      if (dbValue) {
        await Util.redisSet(redisKey, dbValue.value, cacheMillis);
      }
    }
    return val;
  }

  /**
   * Returns the complete user record
   * @param address
   */
  public static async getUserRecord(
    address: string | null,
    user?: User,
  ): Promise<any> {
    // Set up our database stuff
    const userRepository = getRepository<User>(User);
    const userPropRepository = getRepository<UserProperty>(UserProperty);
    const goldTxRepo = getRepository<GoldTransaction>(GoldTransaction);

    // See if we already have an account with Cool Cats, if so use it.
    if (!user && address) {
      user = await userRepository
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.user_properties', 'userProperties')
        .where(`LOWER(u.account) = LOWER(:acnt)`, { acnt: address })
        .getOne();
    }
    if (user) {
      // Synthesize our payload
      const payload: any = {
        address: user.account,
        created: new Date(user.created).getTime() / 1000,
        lastLogin: new Date(user.last_login).getTime() / 1000,
      };
      if (user.user_properties && user.user_properties.length > 0) {
        // Map the user properties to make it nicer
        payload.properties = {};
        user.user_properties.forEach((val: any) => {
          payload.properties[val.key] = val.value.toString().trim();
        });
      } else {
        payload.properties = new Array<IUserProperty>();
      }
      const recentGoldTx = await goldTxRepo.findOne({
        where: {
          account: user.account,
          description: 'Cool Cat owner GOLD claimed',
        },
        order: { id: 'DESC' },
      });

      let lastGoldClaimTime = 0;
      if (recentGoldTx) {
        lastGoldClaimTime = Date.parse(recentGoldTx.timestamp);
      }

      payload.lastGoldClaimTime = lastGoldClaimTime;

      const ruleString: string = await Util.cachedKeyVal(
        'SYSTEM_CONFIG',
        'chainRateLimitRules',
        60000,
      );
      if (ruleString) {
        payload.chainRateLimitRules = JSON.parse(ruleString);
      }

      return payload;
    } else {
      throw new NotFoundException();
    }
  }

  /**
   * Return a bool whether the user is connected to the System Checker or not (from the blockchain)
   */
  public static async isUserConnected(address: string): Promise<boolean> {
    // Retrieve from cache if we can
    const cacheKey: string = await this.getUserCacheKey(
      address,
      ECacheKeys.IS_CONNECTED,
    );
    const isConnected: string = await this.redisGet(cacheKey);
    if (typeof isConnected === 'string') {
      if (isConnected) {
        return isConnected === 'true';
      }
    }

    if (!ethers.utils.isAddress(address)) {
      return false;
    }

    // Grab the blockchain contract record for the SYSTEM_CHECKER contract
    const systemCheckerContract: BlockchainContract | undefined =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'SYSTEM_CHECKER',
          mode: Environment.env.MODE,
        },
      });
    if (!systemCheckerContract) {
      return false;
    }

    // Grab provider
    const providers: string[] = systemCheckerContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      systemCheckerContract.abi
        .toString()
        .replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      systemCheckerContract.address,
    );

    // Get the owner of a given catTokenId from the blockchain (with retry capability)
    const isUserConnected = async (retryCount: number): Promise<boolean> => {
      try {
        return await contractWeb3Instance.methods.isConnected(address).call();
      } catch (error) {
        console.log(`Error providers: ${systemCheckerContract.provider}`);
        console.log(
          `System contract address: ${systemCheckerContract.address}`,
        );
        console.log(error);
        if (retryCount > 0) {
          return await isUserConnected(--retryCount);
        } else {
          return false;
        }
      }
    };

    const toRet: boolean = await isUserConnected(3);

    // Put result in cache for 1 second and return
    if (typeof toRet !== undefined) {
      const val: string = toRet ? 'true' : 'false';
      await this.redisSet(cacheKey, val, 5000);
      return toRet;
    } else {
      return false;
    }
  }

  /**
   * Get whether a pet has quested today or not
   */
  public static async hasPetQuestedInDailyReset(petTokenId: number) {
    const key = `hasPetQuestedInDailyReset-${petTokenId}`;
    const hasPetQuestedString = await Util.redisGet(key);
    if (hasPetQuestedString) {
      return hasPetQuestedString === 'true';
    }

    // Grab the blockchain contract record for the QUEST contract
    const questContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'QUEST',
          mode: Environment.env.MODE,
        },
      });
    if (!questContract) {
      throw new BadRequestException(
        `Could not find blockchain contract record for code \'QUEST\'`,
      );
    }

    // Grab provider
    const providers: string[] = questContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      questContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      questContract.address,
    );

    // Get a bool if a pet has quested today or not from the blockchain
    const getIfPetHasQuestedToday = async (
      retryCount: number,
    ): Promise<boolean> => {
      try {
        return await contractWeb3Instance.methods
          .hasPetQuestedToday(petTokenId)
          .call();
      } catch (error) {
        if (retryCount > 0) {
          return await getIfPetHasQuestedToday(--retryCount);
        } else {
          return false;
        }
      }
    };

    const toRet = await getIfPetHasQuestedToday(3);

    await Util.redisSet(key, `${toRet}`.toLowerCase(), 120000);

    return toRet;
  }

  /**
   * Get whether a pet has quested today or not
   */
  public static async getQuestsRemainingForPetInDailyResetPeriod(
    petTokenId: number,
  ) {
    const key = `getQuestsRemainingForPetInDailyResetPeriod-${petTokenId}`;
    const questsRemainingString = await Util.redisGet(key);
    if (questsRemainingString) {
      return parseInt(questsRemainingString);
    }

    // Grab the blockchain contract record for the QUEST contract
    const questContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'QUEST',
          mode: Environment.env.MODE,
        },
      });
    if (!questContract) {
      throw new BadRequestException(
        `Could not find blockchain contract record for code \'QUEST\'`,
      );
    }

    // Grab provider
    const providers: string[] = questContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      questContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      questContract.address,
    );

    // Get a bool if a pet has quested today or not from the blockchain
    const getQuestsRemaining = async (retryCount: number): Promise<number> => {
      try {
        return await contractWeb3Instance.methods
          .getQuestsRemainingForPet(petTokenId)
          .call();
      } catch (error) {
        if (retryCount > 0) {
          return await getQuestsRemaining(--retryCount);
        } else {
          return 0;
        }
      }
    };

    const toRet = await getQuestsRemaining(3);

    await Util.redisSet(key, `${toRet}`.toLowerCase(), 3000);

    return toRet;
  }

  /**
   * Throws an exception if the address does not own a cat or pet
   * @param address
   */
  public static async mustHavePetOrCatDatabase(address: string): Promise<void> {
    // See if we have cached
    const userKey: string = await Util.getUserCacheKey(
      address,
      ECacheKeys.MUST_HAVE_PET_OR_CAT,
    );
    const cached: string = await Util.redisGet(userKey);
    if (cached === 'true') {
      throw new NotFoundException(
        'You must have a cat or pet to call this method',
      );
    }

    // Grab our cool cats contract
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const coolCatContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLCAT_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolCatContract) {
      throw new NotFoundException('COOLCAT_721 contract not found');
    }

    // Grab our cool pets contract
    const coolPetContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolPetContract) {
      throw new NotFoundException('COOLPET_721 contract not found');
    }

    // First we need to get the addresses currently owned cats
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedCoolCats: CoolcatOwner[] = await contractRepository.find({
      where: {
        to: address,
        blockchainContract: coolCatContract,
      },
    });

    // get the addresses currently owned pets
    const ownedPets = await contractRepository.find({
      where: {
        to: address,
        blockchainContract: coolPetContract,
      },
    });
    if (ownedCoolCats.length === 0 && ownedPets.length === 0) {
      await Util.redisSet(userKey, 'true', 10000);
      throw new NotFoundException(
        'You must have a cat or pet to call this method',
      );
    }
  }

  /**
   * Throws an exception if the address does not own a cat or pet
   * @param address
   */
  public static async mustHavePetOrCat(address: string): Promise<void> {
    // See if we have cached
    const userKey: string = await Util.getUserCacheKey(
      address,
      ECacheKeys.MUST_HAVE_PET_OR_CAT,
    );
    const cached: string = await Util.redisGet(userKey);
    if (cached === 'true') {
      throw new NotFoundException(
        'You must have a cat or pet to call this method',
      );
    }

    const [ownedCoolCats, ownedPetCount] = await Promise.all([
      Util.getOwnedCats(address),
      Util.getOwnedPetCount(address),
    ]);

    if (ownedCoolCats.length === 0 && ownedPetCount === 0) {
      await Util.redisSet(userKey, 'true', 60000);
      throw new NotFoundException(
        'You must have a cat or pet to call this method',
      );
    }
  }

  /**
   * Get Cool Pet tokens owned by an address from the blockchain
   */
  public static async getOwnedPets(account: string): Promise<number[]> {
    if (!ethers.utils.isAddress(account)) {
      return [];
    }
    // Grab the blockchain contract record for the PET_UTILS contract
    const petUtilsContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'PET_UTILS',
          mode: Environment.env.MODE,
        },
      });
    if (!petUtilsContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'PET_UTILS'",
      );
    }

    // Grab provider
    const providers: string[] = petUtilsContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      petUtilsContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      petUtilsContract.address,
    );

    // Get the owned cats for a given account from the blockchain (with retry capability)
    const getOwnedTokens = async (retryCount: number): Promise<string> => {
      try {
        return await contractWeb3Instance.methods
          .getWalletOfOwnerForSelection(account, 0, 19999)
          .call();
      } catch (error) {
        if (retryCount > 0) {
          return await getOwnedTokens(--retryCount);
        } else {
          return '';
        }
      }
    };

    const tokenIds = Util.validateIdListParameter(
      (await getOwnedTokens(3)).replace(/,\s*$/, ''),
    );

    // User owns no pets (validateIdListParameter was passed a blank string)
    if (!tokenIds) {
      return [];
    }

    return tokenIds;
  }

  /**
   * Get Cool Pet tokens owned by an address from the blockchain
   */
  public static async getOwnedPetCount(account: string): Promise<number> {
    if (!ethers.utils.isAddress(account)) {
      return 0;
    }
    // Grab the blockchain contract record for the COOLPET_721 contract
    const coolPetsContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolPetsContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'COOLPET_721'",
      );
    }

    // Grab provider
    const providers: string[] = coolPetsContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      coolPetsContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      coolPetsContract.address,
    );

    // Get the owned cats for a given account from the blockchain (with retry capability)
    const getOwnedTokenCount = async (retryCount: number): Promise<number> => {
      try {
        return await contractWeb3Instance.methods.balanceOf(account).call();
      } catch (error) {
        if (retryCount > 0) {
          return await getOwnedTokenCount(--retryCount);
        } else {
          return 0;
        }
      }
    };

    return await getOwnedTokenCount(3);
  }

  /**
   * Get Cool Cat tokens owned by an address from the blockchain
   */
  public static async getOwnedCats(account: string): Promise<any> {
    if (!ethers.utils.isAddress(account)) {
      return [];
    }
    // Grab the blockchain contract record for the COOLPET_721 contract
    const catContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'COOLCAT_721',
          mode: Environment.env.MODE,
        },
      });
    if (!catContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'COOLCAT_721'",
      );
    }

    // Grab provider
    const providers: string[] = catContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = [
      {
        inputs: [
          {
            internalType: 'address',
            name: '_owner',
            type: 'address',
          },
        ],
        name: 'walletOfOwner',
        outputs: [
          {
            internalType: 'uint256[]',
            name: '',
            type: 'uint256[]',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      catContract.address,
    );

    // Get the owned cats for a given account from the blockchain (with retry capability)
    const getOwnedTokens = async (retryCount: number): Promise<string[]> => {
      try {
        return await contractWeb3Instance.methods.walletOfOwner(account).call();
      } catch (error) {
        if (retryCount > 0) {
          return await getOwnedTokens(--retryCount);
        } else {
          return [];
        }
      }
    };

    return (await getOwnedTokens(3)).map((id) => parseInt(id));
  }

  /**
   * Hits the database to determine if service is unavailable
   */
  public static async serviceUnavailable(address: string): Promise<boolean> {
    // See if we are whitelisted, and if so - let it pass
    let whitelist: string[];
    const wlFromRedisString: string = await Util.redisGet(
      ERedisKey.TEAM_WHITELIST,
    );
    if (wlFromRedisString) {
      // Got whitelist in cache
      whitelist = JSON.parse(wlFromRedisString);
    } else {
      // Get whitelist from database
      const wlRepo = getRepository<Whitelist>(Whitelist);
      const whitelistFromDB: Whitelist[] = await wlRepo.find();
      whitelist = whitelistFromDB.map((val: Whitelist) => {
        return val.address.toLowerCase();
      });
      await Util.redisSet(
        ERedisKey.TEAM_WHITELIST,
        JSON.stringify(whitelist),
        120_000,
      );
    }
    if (whitelist.indexOf(address.toLowerCase()) >= 0) {
      return false;
    } else if (whitelist.length > 0) {
      throw new HttpException(
        `Address ${address.toLowerCase()} is not on the whitelist. Service unavailable.`,
        403,
      );
    }

    // Now move on to see if service is unavailable
    let kill: string = await Util.redisGet(ERedisKey.SERVICE_UNAVAILABLE);
    if (
      kill &&
      (kill.toLowerCase() === 'true' || kill.toLowerCase() === 'false')
    ) {
      return kill.toLowerCase() === 'true';
    }

    const keyValRepo: Repository<KeyValue> = getRepository(KeyValue);
    const serviceUnavailable: KeyValue | undefined = await keyValRepo.findOne({
      where: {
        namespace: 'SYSTEM_MAINTENANCE',
        key: 'serviceUnavailable',
      },
    });

    kill =
      serviceUnavailable && serviceUnavailable.value.toLowerCase() === 'true'
        ? 'true'
        : 'false';

    // Cached for 30 seconds
    await Util.redisSet(ERedisKey.SERVICE_UNAVAILABLE, kill, 30_000);
    return kill === 'true';
  }

  /**
   * Get stage of a Pet from the blockchain
   *   // egg = 0
   *   // stage1 = 1
   *   // stage2 = 2
   *   // final form = 3
   */
  public static async getPetStage(
    petTokenId: number,
  ): Promise<number | undefined> {
    // Grab the blockchain contract record for the PET_INTERACTION contract
    const petInteractionContract: BlockchainContract | undefined =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'PET_INTERACTION',
          mode: Environment.env.MODE,
        },
      });
    if (!petInteractionContract) {
      return undefined;
    }

    // Grab provider
    const providers: string[] = petInteractionContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      petInteractionContract.abi
        .toString()
        .replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      petInteractionContract.address,
    );

    // Get the stage of a pet from the blockchain (with retry capability)
    const getPetStage = async (retryCount: number): Promise<string> => {
      try {
        return await contractWeb3Instance.methods
          .getCurrentPetStage(petTokenId)
          .call();
      } catch (error) {
        if (retryCount > 0) {
          return await getPetStage(--retryCount);
        } else {
          return '0';
        }
      }
    };

    const toRet: string = await getPetStage(3);
    return parseInt(toRet);
  }

  /**
   * Get Cool Pet token owner address from token id from the blockchain
   */
  public static async getPetOwner(petTokenId: number): Promise<any> {
    // Grab the blockchain contract record for the COOLPET_721 contract
    const petContract: BlockchainContract | undefined =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!petContract) {
      return undefined;
    }

    // Grab provider
    const providers: string[] = petContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      petContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      petContract.address,
    );

    // Get the owner of a given petTokenId from the blockchain (with retry capability)
    const getTokenOwner = async (
      retryCount: number,
    ): Promise<any[] | undefined> => {
      try {
        return await contractWeb3Instance.methods.ownerOf(petTokenId).call();
      } catch (error) {
        if (retryCount > 0) {
          return await getTokenOwner(--retryCount);
        } else {
          return undefined;
        }
      }
    };

    return await getTokenOwner(3);
  }

  /**
   * Get Cool Pet token owner address from token id from the blockchain
   */
  public static async doesUserOwnToken(
    contractCode: 'COOLCAT_721' | 'COOLPET_721',
    tokenId: number,
    ethAddress: string,
  ): Promise<boolean> {
    // Grab the blockchain contract record for the COOLPET_721 contract
    const tokenContract: BlockchainContract | undefined =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: contractCode,
          mode: Environment.env.MODE,
        },
      });
    if (!tokenContract) {
      return false;
    }

    // Grab provider
    const providers: string[] = tokenContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      tokenContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    const contractWeb3Instance = new web3.eth.Contract(
      abi,
      tokenContract.address,
    );

    // Get the owner of a given petTokenId from the blockchain (with retry capability)
    const getTokenOwner = async (
      retryCount: number,
    ): Promise<string | undefined> => {
      try {
        return await contractWeb3Instance.methods.ownerOf(tokenId).call();
      } catch (error) {
        if (retryCount > 0) {
          return await getTokenOwner(--retryCount);
        } else {
          return undefined;
        }
      }
    };

    const owner = await getTokenOwner(3);
    if (owner) {
      return owner.toLowerCase() === ethAddress.toLowerCase();
    } else {
      return false;
    }
  }

  /**
   * Returns a signature for the query string parameters
   * @param query
   */
  public static querySignature(query: any): string | undefined {
    const keys: string[] = Object.keys(query);
    keys.sort();
    let stringHash = '';
    keys.forEach((val: string) => {
      stringHash = stringHash + val + query[val];
      if (stringHash.length > 2048) {
        throw new BadRequestException('Invalid parameters');
      }
    });

    const toRet: string = ethers.utils.sha256(
      ethers.utils.toUtf8Bytes(stringHash),
    );

    return toRet;
  }

  /**
   * Returns the current box price
   */
  public static async getBoxPrice(): Promise<string> {
    // Pull box price from Redis cache if we have it there
    let boxPrice: string = await Util.redisGet(ERedisKey.PET_BOX_PRICE);
    if (boxPrice) {
      return boxPrice;
    }

    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'ITEM_FACTORY',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      const providers: string[] = blockchainContract.provider.split('|');
      const provider: string = providers[0];
      const web3 = getWeb3(provider);

      // Grab ABI
      const abi: any = JSON.parse(
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      // Get the box price from the blockchain (with retry capability)
      const getBoxPrice = async (retryCount: number): Promise<string> => {
        try {
          return await contract.methods._boxPrice().call();
        } catch (error) {
          if (retryCount > 0) {
            return getBoxPrice(--retryCount);
          } else {
            throw new BadRequestException('Could not retrieve box price');
          }
        }
      };

      boxPrice = await getBoxPrice(5);

      // Put box price into redis cache
      await Util.redisSet(ERedisKey.PET_BOX_PRICE, boxPrice, 900_000);

      return boxPrice;
    } else {
      throw new Error('Could not find ITEM_FACTORY');
    }
  }

  /**
   * Returns the current price to reRoll a quest selection
   */
  public static async getQuestReRollCost() {
    // Pull reRollCost from Redis cache if we have it there
    let reRollCost: string = await Util.redisGet(ERedisKey.QUEST_RE_ROLL_PRICE);
    if (reRollCost) {
      return reRollCost;
    }

    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'QUEST',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      const providers: string[] = blockchainContract.provider.split('|');
      const provider: string = providers[0];
      const web3 = getWeb3(provider);

      // Grab ABI
      const abi: any = JSON.parse(
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      // Get the box price from the blockchain (with retry capability)
      const getQuestReRollCost = async (
        retryCount: number,
      ): Promise<string> => {
        try {
          return await contract.methods._reRollCost().call();
        } catch (error) {
          if (retryCount > 0) {
            console.log(
              `Retrying getQuestReRollCost after error - ${retryCount}`,
            );
            return getQuestReRollCost(--retryCount);
          } else {
            throw new BadRequestException(
              'Could not retrieve quest re-roll cost from the blockchain',
            );
          }
        }
      };

      reRollCost = await getQuestReRollCost(5);

      // Put reRollCost into redis cache for five minutes
      await Util.redisSet(ERedisKey.QUEST_RE_ROLL_PRICE, reRollCost, 300_000);

      return reRollCost;
    } else {
      throw new Error('Could not find QUEST');
    }
  }

  /**
   * Zero pads out a string to make it a particular length
   * @param val
   * @param desiredLength
   */
  public static leftZeroPad(val: string, desiredLength: number): string {
    let padCount: number = desiredLength - val.length;
    let output: string = val;
    while (padCount > 0) {
      output = `0${output}`;
      padCount--;
    }
    return output;
  }

  /**
   * Connects to the elasti cache redis service
   */
  public static async connectToRedis(useLocalhost = false): Promise<void> {
    if (Util.redis) {
      return;
    }
    try {
      const options: any = useLocalhost
        ? {}
        : {
            url: `redis://${Environment.env.REDIS_ENDPOINT}:${Environment.env.REDIS_PORT}`,
          };
      Util.redis = createClient(options);
      await Util.redis.connect();
    } catch (err: any) {
      Util.redis = null;
      const message: string =
        err && err.message ? err.message : 'unknown cause';
      throw new GatewayTimeoutException(
        `Could not connect to Redis: ${message}`,
      );
    }
  }

  /**
   * Sets a value in our REDIS store
   * @param key
   * @param value
   * @param ttlMillis
   */
  public static async redisSet(
    key: ERedisKey | string,
    value: string,
    ttlMillis?: number,
  ): Promise<void> {
    const _key: string = `${Environment.env.MODE}-${ethers.utils.sha256(
      ethers.utils.toUtf8Bytes(key),
    )}`;
    if (Util.redis) {
      const options = ttlMillis ? { PX: ttlMillis } : {};
      try {
        await Util.redis.set(_key, value, options);
      } catch (err) {
        // We lost REDIS, try to reconnect
        // TODO Notify operator that we lost connection to REDIS
        try {
          Util.redis = null;
          await Util.connectToRedis();
          // TODO Notify operator that we re-connected to REDIS
          return await Util.redisSet(_key, value, ttlMillis); // Trying again using REDIS after successful re-connect
        } catch (err) {
          // Couldn't re-connect
          // TODO Notify operator that we could not re-connect to REDIS, so we are now using local memory
          Util.redis = null;
          return await Util.redisSet(_key, value, ttlMillis); // No longer using REDIS, using local memory
        }
      }
    } else {
      // We are going to use this process memory
      let timerRef: Timeout;
      if (ttlMillis) {
        timerRef = setTimeout(() => {
          delete Util.localRedis[_key];
        }, ttlMillis);
      }
      Util.localRedis[_key] = {
        timestamp: new Date().getTime(),
        ttlMillis,
        value,
        timerRef,
      };
    }
  }

  /**
   * Deletes a specific key from our REDIS store
   * @param key
   */
  public static async redisDel(key: string): Promise<void> {
    const _key: string = `${Environment.env.MODE}-${ethers.utils.sha256(
      ethers.utils.toUtf8Bytes(key),
    )}`;
    if (Util.redis) {
      try {
        await Util.redis.del(_key);
      } catch (err) {
        // We lost REDIS, try to reconnect
        // TODO Notify operator that we lost connection to REDIS
        try {
          Util.redis = null;
          await Util.connectToRedis();
          // TODO Notify operator that we re-connected to REDIS
          await Util.redis.del(_key); // Trying again using REDIS after successful re-connect
        } catch (err) {
          // Couldn't re-connect
          // TODO Notify operator that we could not re-connect to REDIS, so we are now using local memory
          Util.redis = null;
          await Util.redis.del(_key); // No longer using REDIS, using local memory
        }
      }
    } else {
      // We are going to use this process memory
      const val: any = Util.localRedis[_key];
      if (val && val.timerRef) {
        clearTimeout(val.timerRef);
      }
      delete Util.localRedis[_key];
    }
  }

  /**
   * Gets a value from our REDIS store
   * @param key
   */
  public static async redisGet(
    key: ERedisKey | string,
  ): Promise<string | undefined> {
    const _key: string = `${Environment.env.MODE}-${ethers.utils.sha256(
      ethers.utils.toUtf8Bytes(key),
    )}`;
    if (Util.redis) {
      try {
        return await Util.redis.get(_key);
      } catch (err) {
        // We lost REDIS, try to reconnect
        // TODO Notify operator that we lost connection to REDIS
        try {
          Util.redis = null;
          await Util.connectToRedis();
          // TODO Notify operator that we re-connected to REDIS
          return await Util.redis.get(_key); // Trying again using REDIS after successful re-connect
        } catch (err) {
          // Couldn't re-connect
          // TODO Notify operator that we could not re-connect to REDIS, so we are now using local memory
          Util.redis = null;
          return await Util.redis.get(_key); // No longer using REDIS, using local memory
        }
      }
    } else {
      // We are going to use this process memory
      const val: any = Util.localRedis[_key];
      if (val) {
        if (val.ttlMillis) {
          const now: number = new Date().getTime();
          const life: number = now - val.timestamp;
          if (life < val.ttlMillis) {
            return val.value;
          } else {
            return undefined;
          }
        } else {
          return val.value;
        }
      } else {
        return undefined;
      }
    }
  }

  /**
   * Returns the quantity of a particular pet item an address owns
   * @param address
   * @param itemId
   */
  public static async getItemCount(
    address: string,
    itemId: number,
  ): Promise<number> {
    const userRepo: Repository<User> = getRepository<User>(User);
    const itemRepo: Repository<PetItem> = getRepository<PetItem>(PetItem);
    const userItemRepo: Repository<PetUserItem> =
      getRepository<PetUserItem>(PetUserItem);

    const user: User | undefined = await userRepo.findOne({
      where: {
        account: address,
      },
    });
    if (!user) {
      return 0;
    }

    const petItem: PetItem | undefined = await itemRepo.findOne({
      where: {
        item_id: itemId,
      },
    });
    if (!petItem) {
      return 0;
    }

    const userItem: PetUserItem | undefined = await userItemRepo.findOne({
      where: {
        user,
        pet_item: petItem,
      },
    });
    if (userItem) {
      return userItem.quantity;
    } else {
      return 0;
    }
  }

  /**
   * Returns the quantity of a particular pet item an address owns
   * @param petTokenId
   */
  public static async getPetInteractionCounts(
    petTokenId: number,
  ): Promise<any> {
    const interactionRepo = getRepository<PetInteraction>(PetInteraction);
    // const itemRepo: Repository<PetItem> = getRepository<PetItem>(PetItem);

    const interactions: PetInteraction[] = await interactionRepo.find({
      relations: ['coolpet', 'pet_item'],
      where: {
        coolpet: { token_id: petTokenId },
      },
    });
    if (!interactions) {
      return {};
    }

    const data: { [key: number]: number } = {};
    for (let i = 0; i < interactions.length; i++) {
      const interaction: PetInteraction = interactions[i];

      if (!data[interaction.pet_item.item_id]) {
        data[interaction.pet_item.item_id] = 0;
      }
      data[interaction.pet_item.item_id]++;
    }

    return data;
  }

  /**
   * Returns the percentage of a pet to it's next stage
   * @param petTokenId
   */
  public static async getPercentageToNextStage(
    petTokenId: number,
  ): Promise<number> {
    // Create instance of the gold contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'PET_INTERACTION',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      const providers: string[] = blockchainContract.provider.split('|');
      const provider: string = providers[0];
      const web3 = getWeb3(provider);

      // Grab ABI
      const abi: any = JSON.parse(
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      // Get the data we need from the blockchain (with retry capability)
      const getInteractionCounts = async (
        retryCount: number,
      ): Promise<[number, number, number]> => {
        try {
          const blobOneInteractions = await contract.methods
            ._blobOneInteractions()
            .call();
          const blobTwoInteractions = await contract.methods
            ._blobTwoInteractions()
            .call();
          const finalFormInteractions = await contract.methods
            ._finalFormInteractions()
            .call();

          return [
            parseInt(blobOneInteractions),
            parseInt(blobTwoInteractions),
            parseInt(finalFormInteractions),
          ];
        } catch (error) {
          if (retryCount > 0) {
            console.log(`Retrying getBoxPrice after error - ${retryCount}`);
            return getInteractionCounts(--retryCount);
          } else {
            throw new BadRequestException(
              `Error getting interaction counts from blockchain.`,
            );
          }
        }
      };

      const interactionRepo = getRepository<PetInteraction>(PetInteraction);
      // const itemRepo: Repository<PetItem> = getRepository<PetItem>(PetItem);

      const interactions: PetInteraction[] = await interactionRepo.find({
        relations: ['coolpet'],
        where: {
          coolpet: { token_id: petTokenId },
        },
      });
      if (!interactions) {
        return 0;
      }

      const [blobOneInteractions, blobTwoInteractions, finalFormInteractions] =
        await getInteractionCounts(5);
      const interactionCount = interactions.length;

      if (interactionCount < blobOneInteractions) {
        return (interactionCount / blobOneInteractions) * 100;
      } else if (interactionCount < blobTwoInteractions) {
        const range = blobTwoInteractions - blobOneInteractions;
        const offsetStart = interactionCount - blobOneInteractions;

        return (offsetStart / range) * 100;
      } else if (interactionCount < finalFormInteractions) {
        const range = finalFormInteractions - blobTwoInteractions;
        const offsetStart = interactionCount - blobTwoInteractions;

        return (offsetStart / range) * 100;
      } else {
        // Pet is final form
        return undefined;
      }
    } else {
      throw new Error('Could not find PET_INTERACTION');
    }
  }

  /**
   * Returns an account's current gold balance
   * @param address
   */
  public static async goldBalance(address: string): Promise<string> {
    // Create instance of the gold contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository(BlockchainContract);
    const blockchainContract: BlockchainContract | undefined =
      await blockchainContractRepository.findOne({
        where: {
          code: 'GOLD_CONTRACT',
          mode: Environment.env.MODE,
        },
      });

    if (blockchainContract) {
      // Grab provider
      const providers: string[] = blockchainContract.provider.split('|');
      const provider: string = providers[0];
      const web3 = getWeb3(provider);

      // Grab ABI
      const abi: any = JSON.parse(
        blockchainContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
      );

      const contract: any = new web3.eth.Contract(
        abi,
        blockchainContract.address,
      );

      // Any error will be caught by parent
      const result = await contract.methods.balanceOf(address).call();
      return result;
    } else {
      throw new Error('Could not find GOLD_CONTRACT');
    }
  }

  public static async getUserQuestsFromBlockchain(address: string) {
    const contract: any = await Util.resolveQuestWeb3Contract();

    // Get the box price from the blockchain (with retry capability)
    const getUserQuests = async (retryCount: number): Promise<[]> => {
      try {
        return await contract.methods.getUserReferenceQuests(address).call();
      } catch (error) {
        if (retryCount > 0) {
          return await getUserQuests(--retryCount);
        } else {
          return [];
        }
      }
    };

    const userQuests = await getUserQuests(3);
    const formattedQuests: TUserReferenceQuest[] = [];

    for (let i = 0; i < userQuests.length; i++) {
      const referenceQuest = userQuests[i];
      formattedQuests.push({
        element: parseInt(referenceQuest[0]),
        questId: parseInt(referenceQuest[1]),
        ioId: parseInt(referenceQuest[2]),
      });
    }

    return formattedQuests;
  }

  /**
   * Returns the web3 contract instance for the quest contract
   * @private
   */
  public static async resolveQuestWeb3Contract(): Promise<any> {
    // Grab the blockchain contract record for the QUEST contract
    const questContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'QUEST',
          mode: Environment.env.MODE,
        },
      });
    if (!questContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'QUEST'",
      );
    }

    // Grab provider
    const providers: string[] = questContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      questContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    return new web3.eth.Contract(abi, questContract.address);
  }

  /**
   * Returns the web3 contract instance for the pet interaction handler contract
   * @private
   */
  public static async resolvePetInteractionWeb3Contract(): Promise<any> {
    // Grab the blockchain contract record for the PET_INTERACTION contract
    const petContract: BlockchainContract =
      await getRepository<BlockchainContract>(BlockchainContract).findOne({
        where: {
          code: 'PET_INTERACTION',
          mode: Environment.env.MODE,
        },
      });
    if (!petContract) {
      throw new BadRequestException(
        "Could not find blockchain contract record for code 'PET_INTERACTION'",
      );
    }

    // Grab provider
    const providers: string[] = petContract.provider.split('|');
    const provider: string = providers[0];
    const web3 = getWeb3(provider);

    // Grab ABI
    const abi: any = JSON.parse(
      petContract.abi.toString().replace(/[\u200B-\u200D\uFEFF]/g, ''),
    );

    // Return the quest web3 contract instance
    return new web3.eth.Contract(abi, petContract.address);
  }

  /**
   * Returns the system account as an IEthereumAccount object
   */
  public static systemAccount(): Promise<IEthereumAccount> {
    return new Promise<IEthereumAccount>((resolve, reject) => {
      if (Environment.env.SYSTEM_ACCOUNT) {
        const systemAccount: IEthereumAccount = JSON.parse(
          Environment.env.SYSTEM_ACCOUNT,
        );
        resolve(systemAccount);
      } else {
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
              const systemAccount: IEthereumAccount = JSON.parse(
                result.SecretString as string,
              );
              resolve(systemAccount);
            } else {
              reject(new Error('Missing SecretString'));
            }
          }
        });
      }
    });
  }

  /**
   * Returns active actions
   */
  public static async getActiveActions(): Promise<Action[]> {
    const actionRepo = getRepository<Action>(Action);

    const actions = await actionRepo.find({
      where: {
        status: Status.ACTIVE,
      },
    });
    if (actions.length == 0) {
      throw new BadRequestException('Could not find active actions');
    }

    return actions;
  }
}

export type TUserReferenceQuest = {
  element: number;
  questId: number;
  ioId: number;
};
