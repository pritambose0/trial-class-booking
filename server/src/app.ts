import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientOrigin }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'trial-class-booking-server',
      timestamp: new Date().toISOString(),
    })
  })

  return app
}
