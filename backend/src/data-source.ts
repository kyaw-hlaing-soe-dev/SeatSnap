import { DataSource } from "typeorm"
import { Clinic } from "./entity/Clinic"
import { AppointmentSlot } from "./entity/AppointmentSlot"
import { Reservation } from "./entity/Reservation"

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: process.env.DATABASE_PATH ?? "./seatsnap.db",
  synchronize: false,
  logging: false,
  entities: [Clinic, AppointmentSlot, Reservation],
  migrations: [`${__dirname}/migration/*.{ts,js}`],
})
