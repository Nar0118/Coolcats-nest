import { MigrationInterface, QueryRunner } from 'typeorm';

export class increaseStageNameLength1648831999565
  implements MigrationInterface
{
  name = 'increaseStageNameLength1648831999565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BlockchainContract\` MODIFY COLUMN \`mode\` varchar (10)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BlockchainContract\` MODIFY COLUMN \`address\` varchar (42)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BlockchainContract\` MODIFY COLUMN \`mode\` varchar (4)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BlockchainContract\` MODIFY COLUMN \`address\` varchar (200)`,
    );
  }
}
