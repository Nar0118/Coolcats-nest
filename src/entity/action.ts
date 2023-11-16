/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActionHistory } from './action-history';
import { Status, TokenType } from '../utility/enums';

@Entity({ name: 'Action' })
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: false })
  @Column('varchar', { length: 66 })
  actionKey: string;

  @Index({ unique: false })
  @Column('varchar', { length: 32 })
  name: string;

  @Column('varchar', { length: 32 })
  price: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.NONE,
  })
  tokenType: TokenType;

  @Column('int')
  limit: number;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  @OneToMany(() => ActionHistory, (actionHistory) => actionHistory.action)
  action_history: ActionHistory[];
}
