import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersion1777485000000 implements MigrationInterface {
  name = "AddVersion1777485000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointment_slot
      ADD COLUMN version INTEGER NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_slot_clinicId`)
    await queryRunner.query(`
      CREATE TABLE appointment_slot_old (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        timeLabel       TEXT NOT NULL,
        availableCount  INTEGER NOT NULL DEFAULT 1,
        category        TEXT NOT NULL DEFAULT 'Walk-in',
        clinicId        INTEGER NOT NULL,
        FOREIGN KEY (clinicId) REFERENCES clinic(id)
      )
    `)
    await queryRunner.query(`
      INSERT INTO appointment_slot_old (id, timeLabel, availableCount, category, clinicId)
      SELECT id, timeLabel, availableCount, category, clinicId
      FROM appointment_slot
    `)
    await queryRunner.query(`DROP TABLE appointment_slot`)
    await queryRunner.query(`ALTER TABLE appointment_slot_old RENAME TO appointment_slot`)
    await queryRunner.query(`CREATE INDEX IDX_slot_clinicId ON appointment_slot(clinicId)`)
  }
}
