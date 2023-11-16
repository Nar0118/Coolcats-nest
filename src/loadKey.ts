/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

export class LoadKey {
  /**
   * Returns our system account key
   */
  public static loadKeyFile(): string {
    try {
      const keys: string = fs.readFileSync('./keys.txt').toString();
      fs.unlinkSync('./keys.txt');
      return keys;
    } catch (error) {
      return null;
    }
  }
}
