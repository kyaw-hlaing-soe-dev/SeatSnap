import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, VersionColumn } from "typeorm"
import { Clinic } from "./Clinic"

@Entity()
export class AppointmentSlot {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  timeLabel!: string

  @Column({ type: "int", default: 1 })
  availableCount!: number

  @Column({ default: "Walk-in" })
  category!: string

  @Index()
  @ManyToOne(() => Clinic, clinic => clinic.slots)
  clinic!: Clinic

  @Column()
  clinicId!: number

  @VersionColumn()
  version!: number
}
