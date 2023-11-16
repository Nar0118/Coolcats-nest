/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { resolve } from 'path';
import { readFileSync } from 'fs';
import { yamlParse } from 'yaml-cfn';
import { Configuration } from 'webpack';
import webpack = require('webpack');

/* eslint-disable */
const { compilerOptions } = require('./tsconfig.json');
/* eslint-enable */

/** Webpack Config Variables */
const conf = {
  prodMode: process.env.NODE_ENV === 'production',
  templatePath: './template.yaml',
};

/**
 * Parsing tsconfig.json paths to resolve aliases
 */
const tsPaths = Object.keys(compilerOptions.paths).reduce(
  (paths, path) =>
    Object.assign(paths, {
      [`${path}`]: resolve(__dirname, compilerOptions.paths[path][0]),
    }),
  {},
);

/**
 * Parsing template.yaml file for function dir locations
 */

/** Interface for AWS SAM Function */
interface ISamFunction {
  Type: string;
  Properties: {
    AssumeRolePolicyDocument?: JSON;
    AutoPublishAlias?: string;
    AutoPublishCodeSha256?: string;
    CodeUri?: string;
    Description?: string;
    Environment?: {
      Variables: {
        [key: string]: string;
      };
    };
    Events?: EventSource;
    FunctionName?: string;
    Handler: string;
    Layers?: { [Ref: string]: string }[];
    Runtime: string;
    Timeout?: number;
    Tracing?: string;
    VersionDescription?: string;
  };
}

// We are reading in our template.yaml file into a JSON
const resources = yamlParse(
  readFileSync(conf.templatePath, { encoding: 'utf-8', flag: 'r' }),
);

// Filter the
const entries = Object.values(resources.Resources)

  .filter(
    (resource: ISamFunction) => resource.Type === 'AWS::Serverless::Function',
  )

  .filter(
    (resource: ISamFunction) =>
      resource.Properties.Runtime &&
      resource.Properties.Runtime.startsWith('nodejs'),
  )

  .map((resource: ISamFunction) => ({
    filename: resource.Properties.Handler.split('.')[0],
    entryPath: resource.Properties.CodeUri.split('/').splice(3).join('/'),
  }))

  .reduce(
    (resources, resource) =>
      Object.assign(resources, {
        [`${resource.filename}`]: `./src/${resource.entryPath}${resource.filename}.ts`,
      }),
    {},
  );

/**
 * Webpack Config
 */
const webpackConfig: Configuration = {
  entry: entries,
  target: 'node',
  mode: conf.prodMode ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: tsPaths,
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  devtool: 'source-map',
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource, context) {
        const lazyImports = [
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/platform-express',
          '@nestjs/websockets/socket-module',
          'cache-manager',
          'class-validator',
          'class-transformer',
          'class-transformer/storage',
          'electron',
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
        } catch (err) {
          return true;
        }
        return false;
      },
    }),
  ],
};

export default webpackConfig;
