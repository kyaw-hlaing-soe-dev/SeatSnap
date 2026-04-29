import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { AppointmentSlot } from "./AppointmentSlot"

export type ReservationStatus = "PENDING" | "COMPLETED" | "EXPIRED"

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: string

  @Column({ default: "PENDING" })
  status!: ReservationStatus

  @Column()
  expiresAt!: Date

  @CreateDateColumn()
  createdAt!: Date

  @ManyToOne(() => AppointmentSlot)
  slot!: AppointmentSlot

  @Column()
  slotId!: number
}
