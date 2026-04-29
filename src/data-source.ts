import { DataSource } from "typeorm"
import { Clinic } from "./entity/Clinic"
import { AppointmentSlot } from "./entity/AppointmentSlot"
import { Reservation } from "./entity/Reservation"

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: "seatsnap.db",
  synchronize: false,
  logging: true,
  entities: [Clinic, AppointmentSlot, Reservation],
  migrations: ["src/migrations/*.ts"],
})
