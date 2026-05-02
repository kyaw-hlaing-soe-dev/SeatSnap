import request from "supertest"
import Redis from "ioredis"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

describe("Rate Limiting", () => {
  beforeEach(async () => {
    const redis = new Redis({ host: "127.0.0.1", port: 6379 })
    await redis.flushdb()
    await redis.quit()
  })

  test("allows 5 requests per minute", async () => {
    const results: number[] = []
    for (let i = 0; i < 5; i++) {
      const res = await api
        .post("/reserve")
        .send({ slotId: 2, userId: `patient-${i}` })
        .set("X-Forwarded-For", "192.168.1.100")
      results.push(res.status)
    }
    expect(results.every((s) => s !== 429)).toBe(true)
  })

  test("blocks the 6th request with 429", async () => {
    for (let i = 0; i < 5; i++) {
      await api
        .post("/reserve")
        .send({ slotId: 2, userId: `patient-${i}` })
        .set("X-Forwarded-For", "192.168.1.200")
    }

    const res = await api
      .post("/reserve")
      .send({ slotId: 2, userId: "patient-extra" })
      .set("X-Forwarded-For", "192.168.1.200")

    expect(res.status).toBe(429)
    expect(res.body.error).toBe("RATE_LIMITED")
    expect(res.body.ref).toBeDefined()
  })

  test("different IPs have independent limits", async () => {
    for (let i = 0; i < 6; i++) {
      await api
        .post("/reserve")
        .send({ slotId: 2, userId: `patient-${i}` })
        .set("X-Forwarded-For", "10.0.0.1")
    }

    const res = await api
      .post("/reserve")
      .send({ slotId: 2, userId: "patient-b" })
      .set("X-Forwarded-For", "10.0.0.2")

    expect(res.status).not.toBe(429)
  })

  test("rate limit only applies to /reserve, not /clinics", async () => {
    for (let i = 0; i < 6; i++) {
      await api
        .post("/reserve")
        .send({ slotId: 2, userId: `p${i}` })
        .set("X-Forwarded-For", "10.0.0.3")
    }

    const res = await api.get("/clinics").set("X-Forwarded-For", "10.0.0.3")
    expect(res.status).toBe(200)
  })
})
