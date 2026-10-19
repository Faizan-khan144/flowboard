import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { SCHEMA_SQL } from './schema-sql.js'

const tursoUrl = process.env.TURSO_DATABASE_URL
const serverless = Boolean(process.env.VERCEL)

async function buildClient() {
  if (tursoUrl) {
    return new PrismaClient({
      adapter: new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
    })
  }

  if (serverless) {
    const { createClient } = await import('@libsql/client')
    const file = path.join(os.tmpdir(), 'flowboard.db')
    const fresh = !fs.existsSync(file)
    const client = createClient({ url: `file:${file}` })
    if (fresh) {
      const statements = SCHEMA_SQL.replace(/^--.*$/gm, '')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean)
      for (const statement of statements) {
        await client.execute(statement).catch(() => {})
      }
    }
    return new PrismaClient({ adapter: new PrismaLibSQL({ url: `file:${file}` }) })
  }

  return new PrismaClient()
}

export const prisma = await buildClient()
