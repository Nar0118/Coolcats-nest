import { MigrationInterface, QueryRunner } from 'typeorm';

export class questsV4Migration1648583564127 implements MigrationInterface {
  name = 'questsV4Migration1648583564127';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` CHANGE COLUMN \`gold_reward\` \`total_milk_reward\` varchar(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` ADD \`base_milk_reward\` varchar(32) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` ADD \`element_milk_bonus\` varchar(32) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` ADD \`pet_stage_milk_bonus\` varchar(32) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` ADD \`modifier_bonus\` varchar(32) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` DROP COLUMN \`modifier_bonus\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` DROP COLUMN \`pet_stage_milk_bonus\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` DROP COLUMN \`element_milk_bonus\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` DROP COLUMN \`base_milk_reward\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`QuestHistory\` CHANGE COLUMN \`total_milk_reward\` \`gold_reward\` varchar(32)`,
    );
  }
}
