import { MigrationInterface, QueryRunner } from 'typeorm';

export class MilkAction1652791716183 implements MigrationInterface {
  name = 'MilkAction1652791716183';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`Action\` (\`id\` int NOT NULL AUTO_INCREMENT, \`actionKey\` varchar(66) NOT NULL, \`name\` varchar(32) NOT NULL, \`price\` varchar(32) NOT NULL, \`description\` text NOT NULL, \`tokenType\` enum ('-', 'cat', 'pet') NOT NULL DEFAULT '-', \`status\` enum ('active', 'dprc') NOT NULL DEFAULT 'active', INDEX \`IDX_b12c49c551c5528abb26d77853\` (\`actionKey\`), INDEX \`IDX_9200652764dee48beb33f27620\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ActionHistory\` (\`id\` int NOT NULL AUTO_INCREMENT, \`guid\` varchar(66) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`status\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '0', \`discord_id\` varchar(18) NOT NULL, \`twitter_id\` varchar(50) NOT NULL, \`token_id\` text NOT NULL, \`details\` text NOT NULL, \`type\` varchar(50) NOT NULL, \`userId\` int NULL, \`actionId\` int NULL, UNIQUE INDEX \`IDX_11d5fa75368713d1cf5aa91aac\` (\`guid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ActionHistory\` ADD CONSTRAINT \`FK_fd10c98e0e6514523c38989c38b\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ActionHistory\` ADD CONSTRAINT \`FK_bba51312ec2dd507a2860309ca6\` FOREIGN KEY (\`actionId\`) REFERENCES \`Action\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ActionHistory\` DROP FOREIGN KEY \`FK_bba51312ec2dd507a2860309ca6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ActionHistory\` DROP FOREIGN KEY \`FK_fd10c98e0e6514523c38989c38b\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_11d5fa75368713d1cf5aa91aac\` ON \`ActionHistory\``,
    );
    await queryRunner.query(`DROP TABLE \`ActionHistory\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9200652764dee48beb33f27620\` ON \`Action\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b12c49c551c5528abb26d77853\` ON \`Action\``,
    );
    await queryRunner.query(`DROP TABLE \`Action\``);
  }
}
