# SeatSnap — Clinic Appointment Booking System

Real-world problem: patients in Myanmar wake up at 5am to physically
queue for clinic slots. Two patients at the counter grab the same slot.
SeatSnap solves this with atomic digital reservations.

## How I Prevented Double-Booking

POST /reserve uses queryRunner.startTransaction() with a
pessimistic_write lock on the appointment slot row. This means:

1. Patient A and Patient B both request the last 9am slot
2. Patient A's transaction locks the row
3. Patient B's request waits
4. Patient A decrements stock and creates a reservation → COMMIT
5. Patient B's transaction reads stock = 0 → returns 409 error

If creating the Reservation record fails after decrementing stock,
the catch block calls rollbackTransaction() which restores the stock
to its original value. No slots are lost.

## Why These Indexes?

**clinicId (B-Tree Index):** The GET /clinics route joins
appointment_slot ON clinicId. Without an index, every query
would scan the entire table. With the index, SQLite jumps
directly to matching rows in O(log n) time.
e slot.
SeatSnap solves this with atomic The cleanup cron
queries WHERE status = 'PENDING' every minute. A standard index
would grow to include all COMPLETED and EXPIRED rows (millions
over time). The partial index only stores PENDING rows — a tiny
subset — so it stays small and fast as the database grows.

## On Vibe Coding (AI Assistance)

AI helped me with boilerplate (entity decorators, route skeletons)
and saved ~30 minutes on syntax I'd have to look up. However, it
initially suggested synchronize: true which would have violated
the assignment constraint, and it generated a transaction pattern
without pessimistic locking — which would NOT have solved the
double-booking problem. I had to manually verify and correct both.

Architecture decisions — transaction boundaries, lock modes,
partial vs full index choice — must be understood and verified
by the developer. AI is a fast typist, not an architect.
