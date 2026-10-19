import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const stamp = (value) => (value ? new Date(value).getTime() : 0)

router.get('/', async (req, res) => {
  const teamId = String(req.query.teamId || '')
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: req.user.id },
    select: { id: true },
  })
  if (!membership) return res.status(403).json({ error: 'Not a member of this team' })

  const issueScope = { project: { teamId } }

  const [issues, labels, comments, issueReactions, commentReactions, activity, members, unread] = await Promise.all([
    prisma.issue.aggregate({ where: issueScope, _max: { updatedAt: true }, _count: { _all: true } }),
    prisma.issueLabel.count({ where: { issue: issueScope } }),
    prisma.comment.aggregate({ where: { issue: issueScope }, _max: { createdAt: true }, _count: { _all: true } }),
    prisma.reaction.count({ where: { issue: issueScope } }),
    prisma.reaction.count({ where: { comment: { issue: issueScope } } }),
    prisma.activity.aggregate({ where: { teamId }, _max: { createdAt: true }, _count: { _all: true } }),
    prisma.teamMember.count({ where: { teamId } }),
    prisma.notification.count({ where: { userId: req.user.id, read: false } }),
  ])

  res.json({
    issues: `${issues._count._all}:${stamp(issues._max.updatedAt)}:${labels}`,
    comments: `${comments._count._all}:${stamp(comments._max.createdAt)}:${issueReactions + commentReactions}`,
    activity: `${activity._count._all}:${stamp(activity._max.createdAt)}`,
    members: `${members}`,
    notifications: `${unread}`,
    unread,
    now: Date.now(),
  })
})

export default router
