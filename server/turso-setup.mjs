import 'dotenv/config'
import fs from 'node:fs'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.')
  process.exit(1)
}

const client = createClient({ url, authToken })
const sql = fs.readFileSync(new URL('./prisma/schema.sql', import.meta.url), 'utf8')
const statements = sql
  .replace(/^--.*$/gm, '')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)

for (const statement of statements) {
  await client.execute(statement)
}

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
console.log(`applied ${statements.length} statements`)
console.log(`tables: ${tables.rows.map((row) => row.name).join(', ')}`)
