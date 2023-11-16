/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Environment } from './environment';
import { Util } from './util';

const v8 = require('v8');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const JWT = require('jsonwebtoken');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const requestIp = require('request-ip');

async function bootstrap() {
  // Function to return an origin given a specific request
  const getOrigin: (req) => string = (req) => {
    let origin: string;
    req.rawHeaders.forEach((val, idx) => {
      if (val.toLowerCase() === 'origin' && idx < req.rawHeaders.length - 1) {
        const originProspect = req.rawHeaders[idx + 1];
        if (
          Environment.env.ALLOWED_ORIGINS.includes(originProspect.toLowerCase())
        ) {
          origin = originProspect;
        }
      }
    });
    if (!origin) {
      // TODO Remove this
      /*
      console.log('----------------------------------------------------------------------------');
      console.log('-------------- DEFAULTING ORIGIN TO https:dev.coolcatsnft.com --------------');
      console.log('----------------------------------------------------------------------------');
      req.rawHeaders.forEach((val, idx) => {
        if (idx % 2 === 0 && idx < (req.rawHeaders.length - 1)) {
          console.log(`${req.rawHeaders[idx]}: ${req.rawHeaders[idx+1]}`);
        }
      });
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
      console.log('----------------------------------------------------------------------------');
      */

      // origin = 'https://localhost:3000';

      // Didn't find origin, so we are defaulting
      origin = 'https:dev.coolcatsnft.com';
    }

    // Notify Util static that we are localhost if we are
    Util.isLocalhost = origin.indexOf('localhost') >= 0;

    return origin;
  };

  // Merge our environment
  Environment.merge(process.env);

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, CoolcatValidation',
    credentials: true,
  });

  // Middleware to attach cors and methods headers
  app.use((req, res, next) => {
    const origin: string = getOrigin(req);

    res.header('Access-Control-Allow-Origin', origin);

    res.header('Access-Control-Allow-Credentials', 'true');

    res.header('Cache-Control', 'no-cache');

    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
  });

  // Middleware to enforce auth route authentication
  app.use((req, res, next) => {
    // If our endpoint is in the /auth/ path or /chain/ path, we require an Authorization JWT token
    if (
      req.originalUrl.indexOf('/auth/') >= 0 ||
      req.originalUrl.indexOf('/chain/') >= 0
    ) {
      // Grab the jwt from the header if present
      let encodedJwt: string;
      req.rawHeaders.forEach((val: string, index: number) => {
        if (val.toLowerCase() === 'coolcatvalidation') {
          if (req.rawHeaders[index + 1]) {
            encodedJwt = req.rawHeaders[index + 1];
          }
        }
      });

      // If not present, see if it is in the server cookie
      if (!encodedJwt) {
        const headerVal: string = req.rawHeaders.find((val: string) => {
          return val.indexOf('Authentication') === 0;
        });

        // TODO Remove this
        // headerVal = 'xxxxxxxxxxxxxxxeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NDczNTA2NzQsImRhdGEiOiIweDFmYmUyYzIwNTc4Zjg2YTM4OTZmN2JkY2E2OWNjYzIxMmZmMzk3MGEiLCJpYXQiOjE2NDcyNjQyNzR9.RO0_EzdU44fuOfhm9NFZ4yzB72gCDT6op-ydnP-Lif0';

        if (headerVal) {
          const semiLoc: number = headerVal.indexOf(';');
          encodedJwt =
            semiLoc >= 0
              ? headerVal.substring(15, semiLoc)
              : headerVal.substr(15);
        }
      }

      if (encodedJwt) {
        try {
          // console.log('-----------------------------------------------------');
          // console.log(`JWT: [ ${encodedJwt} ]`);
          // console.log('-----------------------------------------------------');
          const decodedJwt = JWT.verify(encodedJwt, Environment.env.JWT_SECRET);
          req.ethAddress = decodedJwt.data;
        } catch (error) {
          console.log(error);
          throw new UnauthorizedException(
            `Not authorized to access this resource ${req.originalUrl}`,
          );
        }
      } else {
        throw new UnauthorizedException('Missing authorization header');
      }
    }

    next();
  });

  // Middleware to attach clientIp (searching all the different ways to find that out including forwarders)
  app.use((req, res, next) => {
    req.clientIp = requestIp.getClientIp(req);
    next();
  });

  app.useGlobalPipes(new ValidationPipe());

  // Port
  const port =
    typeof Environment.env.PORT === 'string'
      ? parseInt(Environment.env.PORT)
      : Environment.env.PORT;

  // Try to connect to REDIS
  setTimeout(async () => {
    try {
      console.log(
        `Attempting to connect to REDIS @ ${Environment.env.REDIS_ENDPOINT}:${Environment.env.REDIS_PORT}`,
      );
      await Util.connectToRedis();
      console.log(
        `SUCCESSFULLY CONNECTED TO REDIS @ ${Environment.env.REDIS_ENDPOINT}:${Environment.env.REDIS_PORT}`,
      );
    } catch (err) {
      console.log(`+=========================+`);
      console.log(`| REDIS IS NOT AVAILABLE |`);
      console.log(`+=========================+`);

      // We could try localhost but no need because redis support in Util has a local dictionary
      // it will use if we cannot connect to a REDIS server
      /*
      try {
        console.log(`Attempting to connect to REDIS on localhost`);
        await Util.connectToRedis(true);
        console.log(`SUCCESSFULLY CONNECTED TO REDIS on localhost`);
      } catch (err) {
        console.log(`+======================================+`);
        console.log(`| REDIS IS NOT AVAILABLLE ON LOCALHOST |`);
        console.log(`+======================================+`);
      }
      */
    }
  }, 100);

  console.log('------------------');
  console.log(`Node Version: ${process.version}`);
  console.log(`Heap limit: ${(v8.getHeapStatistics().heap_size_limit / 1024 ** 3).toFixed(2)} GB`)
  console.log('------------------');

  // Start server
  await app.listen(Environment.env.PORT);
}
bootstrap();
