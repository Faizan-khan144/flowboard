import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const tursoUrl = process.env.TURSO_DATABASE_URL

export const prisma = tursoUrl
  ? new PrismaClient({
      adapter: new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
    })
  : new PrismaClient()
