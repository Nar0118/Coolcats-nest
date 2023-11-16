/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

// lambda.ts
import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Environment } from './environment';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const JWT = require('jsonwebtoken');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const requestIp = require('request-ip');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();

    // Attach middleware to add CORS headers
    expressApp.use((req, res, next) => {
      // Allowed origins
      let origin: string;
      req.rawHeaders.forEach((val, idx) => {
        if (val.toLowerCase() === 'host' && idx < req.rawHeaders.length - 1) {
          const host: string = req.rawHeaders[idx + 1].split(':')[0];
          if (Environment.env.ALLOWED_ORIGINS.includes(host.toLowerCase())) {
            origin = req.rawHeaders[idx + 1];
          }
        }
      });
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      // Allowed Methods
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      next();
    });

    // Middleware to enforce auth route authentication
    expressApp.use((req, res, next) => {
      // If our endpoint is in the /auth/ path, we require an Authorization JWT token
      if (req.originalUrl.indexOf('/auth/') >= 0) {
        const headerVal = req.rawHeaders.find((val: string) => {
          return val.indexOf('Authentication=') === 0;
        });
        if (headerVal) {
          const encodedJwt: string = headerVal.substr(15);
          try {
            const decodedJwt = JWT.verify(
              encodedJwt,
              Environment.env.JWT_SECRET,
            );
            req.ethAddress = decodedJwt.data;
          } catch (error) {
            throw new UnauthorizedException(
              'Not authorized to access this resource',
            );
          }
        } else {
          throw new UnauthorizedException('Missing authorization header');
        }
      }

      next();
    });

    // Middleware to attach clientIp (searching all the different ways to find that out including forwarders)
    expressApp.use((req, res, next) => {
      req.clientIp = requestIp.getClientIp(req);
      next();
    });

    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    nestApp.use(eventContext());
    nestApp.useGlobalPipes(new ValidationPipe());
    await nestApp.init();

    // Create the server
    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  }

  return cachedServer;
}

export const handler: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrapServer();
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
