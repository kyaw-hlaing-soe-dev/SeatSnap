import request from "supertest"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

describe("GET /clinics", () => {
  test("returns all clinics with their slots", async () => {
    const res = await api.get("/clinics")
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      address: expect.any(String),
      slots: expect.any(Array),
    })
  })

  test("slot response never includes version field", async () => {
    const res = await api.get("/clinics")
    const slot = res.body[0].slots[0]
    expect(slot).not.toHaveProperty("version")
    expect(slot).not.toHaveProperty("clinic")
  })

  test("response includes x-correlation-id header", async () => {
    const res = await api.get("/clinics")
    expect(res.headers["x-correlation-id"]).toBeDefined()
    expect(res.headers["x-correlation-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test("forwards client X-Correlation-ID header", async () => {
    const clientId = "my-test-correlation-id"
    const res = await api.get("/clinics").set("X-Correlation-ID", clientId)
    expect(res.headers["x-correlation-id"]).toBe(clientId)
  })
})
