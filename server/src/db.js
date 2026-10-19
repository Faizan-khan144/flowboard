import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { SCHEMA_SQL } from './schema-sql.js'

const tursoUrl = process.env.TURSO_DATABASE_URL

async function buildClient() {
  if (!tursoUrl) return new PrismaClient()

  const { createClient } = await import('@libsql/client')
  const client = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  const existing = await client
    .execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .catch(() => ({ rows: [null] }))
  if (!existing.rows.length) {
    const statements = SCHEMA_SQL.replace(/^--.*$/gm, '')
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean)
    for (const statement of statements) {
      await client.execute(statement).catch(() => {})
    }
  }
  return new PrismaClient({
    adapter: new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
  })
}

export const prisma = await buildClient()
