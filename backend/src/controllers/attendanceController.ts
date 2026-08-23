import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AttendanceService } from '../services/attendanceService';
import { detectCollege } from '../utils/collegeUtils';

const prisma = new PrismaClient();

export class AttendanceController {
  /**
   * Endpoint: POST /api/attendance/scan
   */
  static async scan(req: Request, res: Response) {
    try {
      const { token, qrToken, eventId, scanMode, mode } = req.body;
      const actualToken = token || qrToken;
      if (!actualToken) {
        return res.status(400).json({ status: 'INVALID', message: 'QR token is required.' });
      }

      const targetIdentifier = scanMode || mode || eventId || 'attendance';
      const result = await AttendanceService.scanQrToken(actualToken, targetIdentifier);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        status: 'INVALID',
        message: err.message || 'Server error processing scan.',
      });
    }
  }

  /**
   * Endpoint: GET /api/admin/attendance
   */
  static async listAttendance(req: Request, res: Response) {
    try {
      const { search, eventId, college, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (eventId && typeof eventId === 'string') {
        where.eventId = eventId;
      }

      if (search && typeof search === 'string') {
        const query = search.trim();
        where.candidate = {
          OR: [
            { studentId: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { program: { contains: query, mode: 'insensitive' } },
          ],
        };
      }

      if (college && typeof college === 'string' && college.toLowerCase() !== 'all') {
        const query = college.trim().toLowerCase();
        if (query === 'mvsr' || query.includes('mvsr')) {
          where.candidate = {
            ...(where.candidate || {}),
            OR: [
              { college: { contains: 'MVSR', mode: 'insensitive' } },
              { studentId: { startsWith: '2451' } },
            ],
          };
        } else if (query === 'matrusri' || query.includes('matrusri') || query === 'mec') {
          where.candidate = {
            ...(where.candidate || {}),
            OR: [
              { college: { contains: 'Matrusri', mode: 'insensitive' } },
              { studentId: { startsWith: '1608' } },
            ],
          };
        } else {
          where.candidate = {
            ...(where.candidate || {}),
            college: { contains: college.trim(), mode: 'insensitive' },
          };
        }
      }

      const [totalCount, records] = await Promise.all([
        prisma.attendance.count({ where }),
        prisma.attendance.findMany({
          where,
          include: {
            candidate: true,
            event: true,
          },
          orderBy: { entryTime: 'desc' },
          skip,
          take: limitNum,
        }),
      ]);

      const formatted = records.map((r) => ({
        id: r.id,
        candidateId: r.candidateId,
        studentId: r.candidate.studentId,
        candidateName: r.candidate.name,
        program: r.candidate.program,
        college: r.candidate.college || detectCollege(r.candidate.studentId),
        paymentStatus: r.candidate.paymentStatus,
        eligibilityStatus: r.candidate.eligibilityStatus,
        eventId: r.eventId,
        eventName: r.event.name,
        entryTime: r.entryTime.toISOString(),
        status: r.status,
      }));

      return res.json({
        records: formatted,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error listing attendance records.' });
    }
  }

  /**
   * Endpoint: GET /api/admin/attendance/export-csv
   */
  static async exportCSV(req: Request, res: Response) {
    try {
      const records = await prisma.attendance.findMany({
        include: { candidate: true, event: true },
        orderBy: { entryTime: 'desc' },
      });

      let csv = 'ID,Student ID,Candidate Name,College,Program,Payment Status,Event,Entry Time,Status\n';
      for (const r of records) {
        const college = r.candidate.college || detectCollege(r.candidate.studentId);
        csv += `"${r.id}","${r.candidate.studentId}","${r.candidate.name}","${college}","${r.candidate.program}","${r.candidate.paymentStatus}","${r.event.name}","${r.entryTime.toISOString()}","${r.status}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Orientation-Attendance-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'CSV export error' });
    }
  }

  /**
   * Endpoint: DELETE /api/attendance/reset
   */
  static async reset(req: Request, res: Response) {
    try {
      const attResult = await prisma.attendance.deleteMany({});
      const qrResult = await prisma.qrToken.deleteMany({});
      return res.json({ message: `Successfully deleted ${attResult.count} attendance records and ${qrResult.count} QR tokens.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error resetting attendance.' });
    }
  }
}
