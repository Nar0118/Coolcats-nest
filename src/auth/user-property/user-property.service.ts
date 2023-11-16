/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateUserPropertyDto } from './dto/create-user-property.dto';
import { UpdateUserPropertyDto } from './dto/update-user-property.dto';
import { Connection, getRepository } from 'typeorm';
import { DatabaseService } from '../../database.service';
import { User } from '../../entity/user';
import { Request } from 'express';
import { UserProperty } from '../../entity/user-property';
import { Config } from '../../config';

@Injectable()
export class UserPropertyService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserPropertyDto: CreateUserPropertyDto, req: Request) {
    const conn: Connection = await this.databaseService.connection;

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });

    if (user) {
      const userPropRepo = getRepository<UserProperty>(UserProperty);

      const numProps: number = await userPropRepo.count({
        where: {
          user,
        },
      });
      if (numProps > Config.MAX_USER_PROPERTIES) {
        throw new BadRequestException('Too many user properties');
      }

      const existingProp: UserProperty = await userPropRepo.findOne({
        where: {
          key: createUserPropertyDto.key,
          user,
        },
      });
      if (existingProp) {
        throw new BadRequestException(
          `Property ${createUserPropertyDto.key} already exists for address ${
            (req as any).ethAddress
          }`,
        );
      }

      const userProp: UserProperty = new UserProperty();
      userProp.key = createUserPropertyDto.key;
      userProp.value = createUserPropertyDto.value;
      userProp.user = user;
      getRepository<UserProperty>(UserProperty).save<UserProperty>(userProp);

      return {
        address: (req as any).ethAddress,
        key: createUserPropertyDto.key,
        value: createUserPropertyDto.value,
      };
    } else {
      throw new BadRequestException(
        `Could not find user for account ${(req as any).ethAddress}`,
      );
    }
  }

  async findAll(req: Request) {
    const conn: Connection = await this.databaseService.connection;

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });
    if (!user) {
      throw new BadRequestException(
        `Could not process request for address ${(req as any).ethAddress}`,
      );
    }

    const props: UserProperty[] = await getRepository<UserProperty>(
      UserProperty,
    ).find({
      where: {
        user,
      },
    });

    if (props) {
      props.forEach((prop: UserProperty) => {
        delete prop.id;
        if (typeof prop.value !== 'string') {
          prop.value = (prop.value as Buffer).toString();
        }
      });
      return {
        address: (req as any).ethAddress,
        properties: props,
      };
    } else {
      throw new NotFoundException(
        `No properties found for address ${(req as any).ethAddress}`,
      );
    }
  }

  async findOne(name: string, req: Request) {
    const conn: Connection = await this.databaseService.connection;

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });
    if (!user) {
      throw new BadRequestException(
        `Could not process request for address ${(req as any).ethAddress}`,
      );
    }

    const prop: UserProperty = await getRepository<UserProperty>(
      UserProperty,
    ).findOne({
      where: {
        key: name,
        user,
      },
    });

    if (typeof prop.value !== 'string') {
      prop.value = (prop.value as Buffer).toString();
    }
    if (prop) {
      return {
        address: (req as any).ethAddress,
        key: name,
        value: prop.value,
      };
    } else {
      throw new NotFoundException(
        `Property ${name} not found for address ${(req as any).ethAddress}`,
      );
    }
  }

  async update(
    name: string,
    updateUserPropertyDto: UpdateUserPropertyDto,
    req: Request,
  ) {
    const conn: Connection = await this.databaseService.connection;

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });

    if (user) {
      const existingProp: UserProperty = await getRepository<UserProperty>(
        UserProperty,
      ).findOne({
        where: {
          key: name,
          user,
        },
      });
      if (!existingProp) {
        throw new BadRequestException(
          `Property ${name} does not exists for address ${
            (req as any).ethAddress
          }`,
        );
      } else {
        existingProp.value = updateUserPropertyDto.value;
        await getRepository<UserProperty>(UserProperty).save(existingProp);
        return {
          address: (req as any).ethAddress,
          key: name,
          value: updateUserPropertyDto.value,
        };
      }
    } else {
      throw new NotFoundException(
        `Property ${name} not found for address ${(req as any).ethAddress}`,
      );
    }
  }

  async remove(name: string, req: Request) {
    const conn: Connection = await this.databaseService.connection;

    const user: User = await getRepository<User>(User).findOne({
      where: {
        account: (req as any).ethAddress,
      },
    });

    if (user) {
      const existingProp: UserProperty = await getRepository<UserProperty>(
        UserProperty,
      ).findOne({
        where: {
          key: name,
          user,
        },
      });
      if (!existingProp) {
        throw new BadRequestException(
          `Property ${name} does not exists for address ${
            (req as any).ethAddress
          }`,
        );
      } else {
        await getRepository<UserProperty>(UserProperty).remove(existingProp);
        return {
          address: (req as any).ethAddress,
          key: name,
        };
      }
    } else {
      throw new NotFoundException(
        `Property ${name} not found for address ${(req as any).ethAddress}`,
      );
    }
  }
}
