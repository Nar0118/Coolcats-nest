import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoolShopLimit1654094680938 implements MigrationInterface {
  name = 'CoolShopLimit1654094680938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`Action\` ADD \`limit\` int NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`Action\` DROP COLUMN \`limit\``);
  }
}
