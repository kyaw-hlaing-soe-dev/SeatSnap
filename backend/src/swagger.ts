import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SeatSnap API",
      version: "2.0.0",
      description: "Clinic slot booking"
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }
    ]
  },
  apis: ["./src/routes/*.ts"]
});
