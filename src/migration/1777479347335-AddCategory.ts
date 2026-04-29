import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategory1777479347335 implements MigrationInterface {
    name = 'AddCategory1777479347335'

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointment_slot
      ADD COLUMN category TEXT NOT NULL DEFAULT 'Walk-in'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE appointment_slot_backup AS
        SELECT id, timeLabel, availableCount, clinicId
        FROM appointment_slot
    `)
    await queryRunner.query(`DROP TABLE appointment_slot`)
    await queryRunner.query(`ALTER TABLE appointment_slot_backup RENAME TO appointment_slot`)
    }

}
