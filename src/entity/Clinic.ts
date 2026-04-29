import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { AppointmentSlot } from "./AppointmentSlot"

@Entity()
export class Clinic {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  address!: string

  @OneToMany(() => AppointmentSlot, slot => slot.clinic)
  slots!: AppointmentSlot[]
}
