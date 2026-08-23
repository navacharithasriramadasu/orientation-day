import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QrService } from '../services/qrService';

const prisma = new PrismaClient();

export class CandidateController {
  /**
   * Verifies candidate by Student ID against official database.
   */
  static async verifyCandidate(req: Request, res: Response) {
    try {
      const { studentId } = req.body;
      if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({ error: 'Student ID is required.' });
      }

      const trimmedStudentId = studentId.trim();
      const candidate = await prisma.candidate.findUnique({
        where: { studentId: trimmedStudentId },
      });

      if (!candidate) {
        return res.status(404).json({
          eligible: false,
          status: 'NOT_FOUND',
          message: 'Candidate not found in the official Orientation Day - 2026 Batch list. Please contact the administration.',
        });
      }

      // Removed payment and eligibility checks to allow all students.


      return res.json({
        eligible: true,
        status: 'ELIGIBLE',
        message: 'You are eligible for Orientation Day - 2026 Batch.',
        candidate: {
          id: candidate.id,
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
          college: candidate.college || (candidate.studentId.startsWith('1608') ? 'Matrusri Engineering College' : 'MVSR Engineering College'),
          paymentStatus: candidate.paymentStatus,
          registrationStatus: candidate.registrationStatus,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error during verification.' });
    }
  }

  /**
   * Registers candidate & generates/retrieves single active QR token.
   */
  static async registerAndGetQr(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { eventId: requestedEventId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required.' });
      }

      const candidate = await prisma.candidate.findUnique({
        where: { studentId: studentId.trim() },
      });

      if (!candidate) {
        return res.status(404).json({
          error: 'Candidate not found in the official Orientation Day - 2026 Batch list. Please contact the administration.',
        });
      }

      // Removed payment and eligibility checks to allow all students.

      // Find active event
      let event = await prisma.event.findFirst({
        where: requestedEventId
          ? { OR: [{ id: requestedEventId }, { slug: requestedEventId }] }
          : { isActive: true },
      });

      if (!event) {
        // Fallback: fetch default event or auto-create
        event = await prisma.event.upsert({
          where: { slug: 'attendance' },
          update: { isActive: true },
          create: {
            slug: 'attendance',
            name: 'Orientation Day - 2026 Batch',
            description: 'Official Entrance Attendance & Gate Pass Verification for Orientation Day - 2026 Batch',
            isActive: true,
            requiresPayment: false,
          },
        });
      }

      // Get or create single active QR token for candidate + event
      const qrTokenStr = await QrService.getOrCreateActiveToken(candidate.id, event.id);

      // Update registration status to REGISTERED
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { registrationStatus: 'REGISTERED' },
      });

      return res.json({
        candidate: {
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
          paymentStatus: candidate.paymentStatus,
        },
        event: {
          id: event.id,
          name: event.name,
          slug: event.slug,
        },
        qrToken: qrTokenStr,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error during QR registration.' });
    }
  }

  /**
   * Retrieves active QR for a given Student ID.
   */
  /**
   * Student Login with Roll Number as User ID & Password.
   * Instantly verifies eligibility & generates/retrieves active QR pass.
   */
  static async studentLogin(req: Request, res: Response) {
    console.log(`[Student Login Hit] IP: ${req.ip}, Body:`, req.body);
    try {
      const { studentId, password } = req.body;
      if (!studentId || !password) {
        console.log(`[Student Login Failed] Missing studentId or password`);
        return res.status(400).json({ error: 'User ID (Roll Number) and Password are required.' });
      }

      const trimmedId = studentId.trim();
      const trimmedPass = password.trim();

      // Student Roll Number acts as both User ID and Password
      if (trimmedId.toLowerCase() !== trimmedPass.toLowerCase()) {
        console.log(`[Student Login Failed] Password mismatch for ID: "${trimmedId}"`);
        return res.status(401).json({
          error: 'Invalid Password. For student login, your Roll Number is your User ID and Password.',
        });
      }

      console.log(`[Student Login] Searching for student: "${trimmedId}"`);
      const candidate = await prisma.candidate.findUnique({
        where: { studentId: trimmedId },
      });

      if (!candidate) {
        return res.status(404).json({
          eligible: false,
          status: 'NOT_FOUND',
          error: 'Student record not found. Please verify your Roll Number with the administration.',
        });
      }

      // Removed payment and eligibility checks to allow all students.

      // Active Event lookup with auto-creation fallback
      let activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
      if (!activeEvent) {
        activeEvent = await prisma.event.upsert({
          where: { slug: 'attendance' },
          update: { isActive: true },
          create: {
            slug: 'attendance',
            name: 'Orientation Day - 2026 Batch',
            description: 'Official Entrance Attendance & Gate Pass Verification for Orientation Day - 2026 Batch',
            isActive: true,
            requiresPayment: false,
          },
        });
      }

      // Get or create single active QR token immediately for candidate + event
      const qrTokenStr = await QrService.getOrCreateActiveToken(candidate.id, activeEvent.id);

      // Update registration status to REGISTERED
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { registrationStatus: 'REGISTERED' },
      });

      // Fetch real-time attendance record if already scanned
      const attendance = await prisma.attendance.findUnique({
        where: {
          candidateId_eventId: {
            candidateId: candidate.id,
            eventId: activeEvent.id,
          },
        },
      });

      return res.json({
        eligible: true,
        status: 'ELIGIBLE',
        message: 'Student authenticated successfully.',
        candidate: {
          id: candidate.id,
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
          college: candidate.college || (candidate.studentId.startsWith('1608') ? 'Matrusri Engineering College' : 'MVSR Engineering College'),
          paymentStatus: candidate.paymentStatus,
          registrationStatus: 'REGISTERED',
        },
        event: {
          id: activeEvent.id,
          name: activeEvent.name,
          slug: activeEvent.slug,
        },
        qrToken: qrTokenStr,
        attendance: attendance
          ? {
              id: attendance.id,
              entryTime: attendance.entryTime.toISOString(),
              status: attendance.status,
            }
          : null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error during student login.' });
    }
  }

  /**
   * Retrieves active QR for a given Student ID.
   */
  static async getQr(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const candidate = await prisma.candidate.findUnique({
        where: { studentId: studentId.trim() },
      });

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found.' });
      }

      const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
      if (!activeEvent) {
        return res.status(400).json({ error: 'No active event.' });
      }

      const qrTokenStr = await QrService.getOrCreateActiveToken(candidate.id, activeEvent.id);

      return res.json({
        candidate: {
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
        },
        event: {
          id: activeEvent.id,
          name: activeEvent.name,
        },
        qrToken: qrTokenStr,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error.' });
    }
  }
}
