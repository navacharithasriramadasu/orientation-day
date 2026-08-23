import { PrismaClient } from '@prisma/client';
import { ScanResponse } from '../types';

const prisma = new PrismaClient();

export class AttendanceService {
  /**
   * Ensures default Orientation Day event exists.
   */
  static async ensureDefaultEvents() {
    const entryEvent = await prisma.event.upsert({
      where: { slug: 'attendance' },
      update: { name: 'Orientation Day - 2026 Batch', requiresPayment: false, isActive: true },
      create: {
        slug: 'attendance',
        name: 'Orientation Day - 2026 Batch',
        description: 'Main entrance verification and attendance for all registered candidates',
        requiresPayment: false,
        isActive: true,
      },
    });

    return { entryEvent };
  }

  /**
   * Performs real-time backend validation for Orientation Day Entrance Verification.
   * Checks QR pass authenticity, student record, and enforces duplicate rescan prevention.
   */
  static async scanQrToken(token: string, scanModeOrEventId?: string): Promise<ScanResponse> {
    if (!token || typeof token !== 'string') {
      return {
        status: 'INVALID',
        message: 'Invalid QR code token provided.',
      };
    }

    const { entryEvent } = await this.ensureDefaultEvents();

    let targetEvent = entryEvent;
    if (scanModeOrEventId && scanModeOrEventId !== 'attendance' && scanModeOrEventId !== 'entry') {
      const customEvent = await prisma.event.findFirst({
        where: {
          OR: [{ id: scanModeOrEventId }, { slug: scanModeOrEventId }],
        },
      });
      if (customEvent) {
        targetEvent = customEvent;
      }
    }

    // Step 1: Find QR token and candidate
    const qrToken = await prisma.qrToken.findUnique({
      where: { token: token.trim() },
      include: { candidate: true },
    });

    if (!qrToken || !qrToken.candidate) {
      // Fallback: check if the scanned text is a direct student roll number
      const candidateByRoll = await prisma.candidate.findUnique({
        where: { studentId: token.trim() },
      });

      if (!candidateByRoll) {
        return {
          status: 'INVALID',
          message: 'QR code not recognized in official orientation database.',
        };
      }

      // Generate or find QR token for this candidate
      const existingToken = await prisma.qrToken.findFirst({
        where: { candidateId: candidateByRoll.id },
      });

      if (!existingToken) {
        return {
          status: 'INVALID',
          message: 'Candidate QR pass has not been initialized.',
        };
      }

      return this.processCandidateAttendance(candidateByRoll, existingToken.id, targetEvent);
    }

    if (!qrToken.isActive) {
      return {
        status: 'INVALID',
        reason: 'QR_DISABLED',
        message: 'This QR code pass has been deactivated.',
      };
    }

    return this.processCandidateAttendance(qrToken.candidate, qrToken.id, targetEvent);
  }

  private static async processCandidateAttendance(
    candidate: any,
    qrTokenId: string,
    event: any
  ): Promise<ScanResponse> {
    const norm = (candidate.normalizedPaymentStatus || '').toUpperCase();
    const raw = (candidate.paymentStatus || '').trim().toLowerCase();
    const isPaid = norm === 'PAID' || (raw === 'paid' || (raw.includes('paid') && !raw.includes('not') && !raw.includes('unpaid') && !raw.includes('due')));
    const displayFeeStatus = isPaid ? 'Paid' : (candidate.paymentStatus || 'Not Paid');

    // Duplicate scan check for this event checkpoint
    const existing = await prisma.attendance.findUnique({
      where: {
        candidateId_eventId: {
          candidateId: candidate.id,
          eventId: event.id,
        },
      },
    });

    if (existing) {
      const timeStr = new Date(existing.entryTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return {
        status: 'DUPLICATE',
        message: `ALREADY SCANNED: Entrance entry was already recorded for ${candidate.name} at ${timeStr}.`,
        candidate: {
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
        },
        event: event.name,
        entryTime: existing.entryTime.toISOString(),
      };
    }

    // Step 3: Record new entrance scan
    try {
      const attendance = await prisma.attendance.create({
        data: {
          candidateId: candidate.id,
          eventId: event.id,
          qrTokenId: qrTokenId,
          status: 'SUCCESS',
        },
      });

      return {
        status: 'SUCCESS',
        message: `Entrance Verified for ${candidate.name} (${displayFeeStatus})`,
        candidate: {
          studentId: candidate.studentId,
          name: candidate.name,
          program: candidate.program,
        },
        event: event.name,
        entryTime: attendance.entryTime.toISOString(),
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existingRec = await prisma.attendance.findUnique({
          where: {
            candidateId_eventId: {
              candidateId: candidate.id,
              eventId: event.id,
            },
          },
        });

        return {
          status: 'DUPLICATE',
          message: 'ALREADY SCANNED: Entrance attendance was already recorded.',
          candidate: {
            studentId: candidate.studentId,
            name: candidate.name,
            program: candidate.program,
          },
          event: event.name,
          entryTime: existingRec?.entryTime.toISOString(),
        };
      }
      throw err;
    }
  }
}

