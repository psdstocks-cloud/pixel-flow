import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import stockRouter from './routes/stock'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pixel-flow-api' })
})

// Feature routers
app.use('/stock', stockRouter)

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})