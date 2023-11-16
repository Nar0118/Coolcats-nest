/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { LoadKey } from './loadKey';

export enum EMode {
  PROD = 'prod',
  BETA = 'beta',
  SANDBOX = 'sand',
  DEV = 'dev',
  STAGE = 'stage',
}

export interface IEnvironment {
  PORT: number;
  AWS_REGION: string;
  AWS_DATABASE_SECRET_NAME: string;
  AWS_SYSTEM_WALLET_SECRET_NAME: string;
  AWS_SQS_URL: string;
  MODE: EMode;
  JWT_SECRET: string;
  JWT_EXPIRATION_TIME_SECS: number;
  DB_CREDENTIALS: string;
  SYSTEM_ACCOUNT?: string;
  ALLOWED_ORIGINS?: string[];
  METADATA_PATH: string;
  CHECK_SIG_ON_LOGIN: boolean;
  REDIS_ENDPOINT: string;
  REDIS_PORT: number;
  AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: string;
  AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: string;
  AWS_CLOUDFRONT_DISTRIBUTION: string;
  OPENSEA_ENDPOINT: string;
  OPENSEA_API_KEY: string;
}

interface envMap {
  [key: string]: IEnvironment;
}

export class Environment {
  /**
   * Holds environment vars that are common to all environments
   * @private
   */
  private static envCommon: any = {
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://localhost:4200',
      'https://127.0.0.1:4200',
      'https://127.0.0.1:3000',
      'https://localhost.coolcatsnft.com:4200',
      'https://dev.coolcatsnft.com',
      'https://staging.coolcatsnft.com',
      'https://prod.coolcatsnft.com',
      'https://stage.coolcatsnft.com',
      'https://coolcatsnft.com',
      'https://www.coolcatsnft.com',
      'https://beta.coolcatsnft.com',
      'https://backoffice.coolcatsnft.com',
      'https://localhost.coolcatsnft.com:4200',
    ],
  };

  private static environments: envMap = {
    prod: {
      PORT: 3000,
      AWS_REGION: 'us-east-1',
      AWS_DATABASE_SECRET_NAME: 'CoolCatsSandbox',
      AWS_SYSTEM_WALLET_SECRET_NAME: 'SystemWallet',
      AWS_SQS_URL:
        'https://sqs.us-east-1.amazonaws.com/683746102303/worker_api_prod.fifo',
      MODE: EMode.PROD,
      DB_CREDENTIALS:
        '{"username": "produser", "password": "Fried769Batter36watch", "engine": "mysql", "host": "127.0.0.1", "port": 3334, "dbname": "coolcatsmysqlprod", "dbClusterIdentifier": "coolcats-prod-2"}',
      JWT_SECRET: '21c32f98-737d-4f86-a115-a314af8d2aff',
      JWT_EXPIRATION_TIME_SECS: 86400,
      METADATA_PATH: 'https://metadata.coolcatsnft.com/',
      CHECK_SIG_ON_LOGIN: true,
      REDIS_ENDPOINT: 'coolcatscache.zlifbx.ng.0001.use1.cache.amazonaws.com',
      REDIS_PORT: 6379,
      AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: 'metadata-coolpets-private',
      AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: 'metadata.coolcatsnft.com',
      AWS_CLOUDFRONT_DISTRIBUTION: 'ECZ8WVIDETVH9',
      OPENSEA_API_KEY: 'dcda06ee1b114760bf3a934d0990eec0',
      OPENSEA_ENDPOINT: 'https://api.opensea.io/',
    },
    stage: {
      PORT: 3000,
      AWS_REGION: 'us-east-1',
      AWS_DATABASE_SECRET_NAME: 'CoolCatsStage',
      AWS_SYSTEM_WALLET_SECRET_NAME: 'SystemWallet',
      AWS_SQS_URL:
        'https://sqs.us-east-1.amazonaws.com/683746102303/worker_api_stage.fifo',
      MODE: EMode.STAGE,
      DB_CREDENTIALS:
        '{"username": "stageuser", "password": "Fried769Batter36watch", "engine": "mysql", "host": "127.0.0.1", "port": 3339, "dbname": "coolcatsmysqlstage", "dbClusterIdentifier": "coolcats-stage-2"}',
      JWT_SECRET: '21c32f98-737d-4f86-a115-a314af8d2aff',
      JWT_EXPIRATION_TIME_SECS: 86400,
      METADATA_PATH: 'https://stage-metadata.coolcatsnft.com/',
      CHECK_SIG_ON_LOGIN: true,
      REDIS_ENDPOINT: 'coolcatscache.zlifbx.ng.0001.use1.cache.amazonaws.com',
      REDIS_PORT: 6379,
      AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: 'stage-coolpets-private',
      AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: 'stage-metadata.coolcatsnft.com',
      AWS_CLOUDFRONT_DISTRIBUTION: 'EOZ9FTUF6X8ZN',
      OPENSEA_ENDPOINT: 'https://api.opensea.io/',
      OPENSEA_API_KEY: 'dcda06ee1b114760bf3a934d0990eec0',
    },
    beta: {
      PORT: 3000,
      AWS_REGION: 'us-east-1',
      AWS_DATABASE_SECRET_NAME: 'CoolCatsSandbox',
      AWS_SYSTEM_WALLET_SECRET_NAME: 'SystemWallet',
      AWS_SQS_URL:
        'https://sqs.us-east-1.amazonaws.com/683746102303/worker_api_beta.fifo',
      MODE: EMode.BETA,
      DB_CREDENTIALS:
        '{"username": "betauser", "password": "Fried769Batter36watch", "engine": "mysql", "host": "127.0.0.1", "port": 3335, "dbname": "coolcatsmysqlbeta", "dbClusterIdentifier": "coolcats-beta-2"}',
      JWT_SECRET: '21c32f98-737d-4f86-a115-a314af8d2aff',
      JWT_EXPIRATION_TIME_SECS: 86400,
      METADATA_PATH: 'https://beta-metadata.coolcatsnft.com/',
      CHECK_SIG_ON_LOGIN: true,
      REDIS_ENDPOINT: 'coolcatscache.zlifbx.ng.0001.use1.cache.amazonaws.com',
      REDIS_PORT: 6379,
      AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: 'beta-coolpets-private',
      AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: 'beta-metadata.coolcatsnft.com',
      AWS_CLOUDFRONT_DISTRIBUTION: 'E11AOMHOV65XJF',
      OPENSEA_ENDPOINT: 'https://testnets-api.opensea.io/',
      OPENSEA_API_KEY: 'dcda06ee1b114760bf3a934d0990eec0',
    },
    dev: {
      PORT: 3000,
      AWS_REGION: 'us-east-1',
      AWS_DATABASE_SECRET_NAME: 'CoolCatsDev',
      AWS_SYSTEM_WALLET_SECRET_NAME: 'SystemWallet',
      AWS_SQS_URL:
        'https://sqs.us-east-1.amazonaws.com/683746102303/worker_api_dev.fifo',
      MODE: EMode.BETA,
      DB_CREDENTIALS:
        '{"username": "devuser", "password": "Fried769Batter36watch", "engine": "mysql", "host": "127.0.0.1", "port": 3333, "dbname": "coolcatsmysqldev", "dbClusterIdentifier": "coolcats-prod-2"}',
      JWT_SECRET: '21c32f98-737d-4f86-a115-a314af8d2aff',
      JWT_EXPIRATION_TIME_SECS: 86400,
      METADATA_PATH: 'https://dev-metadata.coolcatsnft.com/',
      CHECK_SIG_ON_LOGIN: true,
      REDIS_ENDPOINT: 'coolcatscache.zlifbx.ng.0001.use1.cache.amazonaws.com',
      REDIS_PORT: 6379,
      AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: 'beta-coolpets-private',
      AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: 'beta-metadata.coolcatsnft.com',
      AWS_CLOUDFRONT_DISTRIBUTION: 'E11AOMHOV65XJF',
      OPENSEA_ENDPOINT: 'https://testnets-api.opensea.io/',
      OPENSEA_API_KEY: 'dcda06ee1b114760bf3a934d0990eec0',
    },
    sand: {
      PORT: 3000,
      AWS_REGION: 'us-east-1',
      AWS_DATABASE_SECRET_NAME: 'CoolCatsSandbox',
      AWS_SYSTEM_WALLET_SECRET_NAME: 'SystemWallet',
      AWS_SQS_URL:
        'https://sqs.us-east-1.amazonaws.com/683746102303/coolcats-sandbox.fifo',
      // TODO This is for testing (set corresponding value in nodeJS server)
      // AWS_SQS_URL: 'https://sqs.us-east-1.amazonaws.com/683746102303/worker_api_prod.fifo',
      MODE: EMode.SANDBOX,
      DB_CREDENTIALS:
        '{"username": "admin", "password": "<fried769Batter36watch>", "engine": "mysql", "host": "coolcatssandbox.crobbjmyg2pc.us-east-1.rds.amazonaws.com", "port": 3306, "dbname": "coolcats", "dbClusterIdentifier": "coolcats-prod-2"}',
      JWT_SECRET: '21c32f98-737d-4f86-a115-a314af8d2aff',
      JWT_EXPIRATION_TIME_SECS: 86400,
      METADATA_PATH: 'https://sand-metadata.coolcatsnft.com/',
      CHECK_SIG_ON_LOGIN: true,
      REDIS_ENDPOINT: 'coolcatscache.zlifbx.ng.0001.use1.cache.amazonaws.com',
      REDIS_PORT: 6379,
      AWS_S3_PRIVATE_PET_METADATA_IMAGE_BUCKET: 'beta-coolpets-private',
      AWS_S3_PUBLIC_PET_METADATA_IMAGE_BUCKET: 'beta-metadata.coolcatsnft.com',
      AWS_CLOUDFRONT_DISTRIBUTION: 'E11AOMHOV65XJF',
      OPENSEA_ENDPOINT: 'https://testnets-api.opensea.io/',
      OPENSEA_API_KEY: 'dcda06ee1b114760bf3a934d0990eec0',
    },
  };

  // SQS TEST: https://sqs.us-east-1.amazonaws.com/683746102303/coolcats-test.fifo
  // SQS SAND: https://sqs.us-east-1.amazonaws.com/683746102303/coolcats-sandbox.fifo

  /**
   * Environment used throughout app
   */
  public static env: IEnvironment;

  /**
   * Method called via main.ts to merge our environments based on current mode environment var (defaults to sandbox)
   * @param valuesToMerge
   */
  public static merge(valuesToMerge: any): void {
    const mode: string = process.env?.MODE ? process.env?.MODE : 'sand';
    Environment.env = {
      ...Environment.environments[mode],
      ...Environment.envCommon,
      ...process.env,
    };

    // Output keys we are using
    if (Environment.env.SYSTEM_ACCOUNT) {
      const key: any = JSON.parse(Environment.env.SYSTEM_ACCOUNT);
      console.log(`------------------`);
      console.log(`USING DEFAULT SYSTEM ACCOUNT ${key.publicAddress}`);
      console.log(`------------------`);
    }
  }
}
