import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const { college } = req.query;

      // Build college filter conditions properly using array inside AND
      const collegeConditions: any[] = [];
      if (college && typeof college === 'string' && college.toLowerCase() !== 'all') {
        const query = college.trim().toLowerCase();
        if (query === 'mvsr' || query.includes('mvsr')) {
          collegeConditions.push({
            OR: [
              { college: { contains: 'MVSR', mode: 'insensitive' } },
              { studentId: { startsWith: '2451' } },
            ],
          });
        } else {
          collegeConditions.push({
            college: { contains: college.trim(), mode: 'insensitive' },
          });
        }
      }

      const baseCandidateWhere = collegeConditions.length > 0 ? { AND: collegeConditions } : {};

      const paidCondition = {
        AND: [
          ...collegeConditions,
          { normalizedPaymentStatus: 'PAID' },
        ],
      };

      const unpaidCondition = {
        AND: [
          ...collegeConditions,
          { normalizedPaymentStatus: { in: ['NOT_PAID', 'PARTIALLY_PAID'] } },
        ],
      };

      // Find default entrance event
      const entryEvent = await prisma.event.findFirst({
        where: {
          OR: [{ slug: 'attendance' }, { slug: 'entry' }],
        },
      });

      const entryEventId = entryEvent?.id;

      // Query database with college filter applied
      const [
        totalCandidates,
        paidCandidates,
        notPaidCandidates,
        eligibleCandidates,
        qrGeneratedCount,
        // Entry scans
        entryCount,
        entryPaidCount,
        entryUnpaidCount,
        programBreakdown,
        collegeBreakdown,
      ] = await Promise.all([
        prisma.candidate.count({ where: baseCandidateWhere }),
        prisma.candidate.count({ where: paidCondition }),
        prisma.candidate.count({ where: unpaidCondition }),
        prisma.candidate.count({ where: { ...baseCandidateWhere, eligibilityStatus: true } }),
        prisma.qrToken.count({
          where: {
            isActive: true,
            ...(Object.keys(baseCandidateWhere).length > 0 ? { candidate: baseCandidateWhere } : {}),
          },
        }),

        // Gate Entry Scans
        entryEventId
          ? prisma.attendance.count({
            where: {
              eventId: entryEventId,
              candidate: baseCandidateWhere,
            },
          })
          : 0,
        entryEventId
          ? prisma.attendance.count({
            where: {
              eventId: entryEventId,
              candidate: paidCondition,
            },
          })
          : 0,
        entryEventId
          ? prisma.attendance.count({
            where: {
              eventId: entryEventId,
              candidate: unpaidCondition,
            },
          })
          : 0,

        prisma.candidate.groupBy({
          where: baseCandidateWhere,
          by: ['program'],
          _count: { id: true },
        }),

        prisma.candidate.groupBy({
          by: ['college'],
          _count: { id: true },
        }),
      ]);

      const entryRemainingCount = Math.max(0, totalCandidates - entryCount);

      const availableColleges = [
        'MVSR Engineering College',
        ...collegeBreakdown
          .map((c) => c.college)
          .filter((c) => c && c !== 'MVSR Engineering College'),
      ];

      return res.json({
        totalCandidates,
        paidCandidates,
        notPaidCandidates,
        eligibleCandidates,
        qrGeneratedCount,

        selectedCollege: (college as string) || 'all',
        availableColleges,

        // Gate Entry
        entryStats: {
          total: entryCount,
          paid: entryPaidCount,
          unpaid: entryUnpaidCount,
          remaining: entryRemainingCount,
          percentage: totalCandidates > 0 ? parseFloat(((entryCount / totalCandidates) * 100).toFixed(1)) : 0,
        },

        // Legacy compatibility fields
        attendanceCount: entryCount,
        attendedPaidCount: entryPaidCount,
        attendedNotPaidCount: entryUnpaidCount,
        remainingEligible: entryRemainingCount,
        attendanceRate: totalCandidates > 0 ? parseFloat(((entryCount / totalCandidates) * 100).toFixed(2)) : 0,

        programBreakdown: programBreakdown.map((p) => ({
          program: p.program,
          count: p._count.id,
        })),

        collegeBreakdown: collegeBreakdown.map((c) => ({
          college: c.college,
          count: c._count.id,
        })),
      });
    } catch (err: any) {
      console.error('[Dashboard Stats Error]', err);
      return res.status(500).json({ error: err.message || 'Error calculating dashboard statistics.' });
    }
  }
}
