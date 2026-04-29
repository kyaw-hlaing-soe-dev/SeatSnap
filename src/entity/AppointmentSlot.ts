import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm"
import { Clinic } from "./Clinic"

@Entity()
export class AppointmentSlot {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  timeLabel!: string

  @Column({ type: "int", default: 1 })
  availableCount!: number

  @Index()
  @ManyToOne(() => Clinic, clinic => clinic.slots)
  clinic!: Clinic

  @Column()
  clinicId!: number
}
