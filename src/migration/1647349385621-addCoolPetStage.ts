import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCoolPetStage1647349385621 implements MigrationInterface {
  name = 'addCoolPetStage1647349385621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`Coolpets\` ADD \`stage\` varchar(50) NOT NULL DEFAULT 'egg'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_6c73746933549b3356435c4de7\` ON \`Coolpets\` (\`stage\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_6c73746933549b3356435c4de7\` ON \`Coolpets\``,
    );
    await queryRunner.query(`ALTER TABLE \`Coolpets\` DROP COLUMN \`stage\``);
  }
}
