import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EligibilityService } from '../src/services/eligibilityService';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Maryala', 'Gunemoni', 'Puttagalla', 'Sama', 'Bandi', 'Yadagiri', 'Kanchanapally',
  'Thalasani', 'Shaik', 'Vaishnavi', 'Lavoori', 'Vatyala', 'Azmeera', 'Dharavath',
  'Konkati', 'Kanchapogu', 'Badavath', 'Bukya', 'Bhukya', 'Vishwas', 'Rasuri',
  'Rajarapu', 'Ananthula', 'Akula', 'Saili', 'Chethi', 'Chinthakindi', 'Pebbeti',
  'Sapavat', 'Ande', 'Surepally', 'Badri', 'Pulipati', 'Kasibhatta', 'Doddapuneni',
  'Rangavajjula', 'Jenige', 'Anamoni', 'Bolishetty', 'Bolloju', 'Sinthoju', 'Panthula',
  'Kondapuram', 'Chowki', 'Sangani', 'Gadwal', 'Bompalli', 'Bhutharaju', 'Sattu'
];

const LAST_NAMES = [
  'Hari Vamshi Krishna', 'Adithya Chandra', 'Sai Ganesh Kumar', 'Keshav Reddy',
  'Bharath Kumar', 'Vishnu Vardhan', 'Vamshi', 'Manikanta Reddy', 'Nouman', 'Meher',
  'Hanumanthu', 'Murali Krishna', 'Raju Nayak', 'Rohith', 'Sreeman', 'Uday',
  'Tarun', 'Sai Venu', 'Dileep', 'Pothuganti', 'Sai Kumar', 'Manohar', 'Vikas',
  'Deepak', 'Sreeja', 'Saideep', 'Bhargavi', 'Srinithya', 'Koushik', 'Krupa Sravanthi',
  'Vivek Vardhan', 'Shushrutha', 'Praveen Kumar', 'Lakshmi Yashasri', 'Tharun'
];

const PROGRAMS = [
  'BE - CIV', 'BE - CSE', 'BE - CSM', 'BE - CSD', 'BE - CIC',
  'BE - ECE', 'BE - EEE', 'BE - INF', 'BE - MEC', 'MBA'
];

async function main() {
  console.log('[Seed] Seeding default event and ~1,000 dummy candidates...');

  // Create Admin user
  const adminPasswordHash = await bcrypt.hash('Admin@2026Password!', 10);
  await prisma.user.upsert({
    where: { username: 'admin@graduation.edu' },
    update: {},
    create: {
      username: 'admin@graduation.edu',
      passwordHash: adminPasswordHash,
      name: 'Graduation Admin',
      role: 'ADMIN',
    },
  });

  // Create default Orientation Event
  const defaultEvent = await prisma.event.upsert({
    where: { slug: 'attendance' },
    update: { name: 'Orientation Day - 2026 Batch', isActive: true },
    create: {
      slug: 'attendance',
      name: 'Orientation Day - 2026 Batch',
      description: 'Official Entrance Attendance for Orientation Day - 2026 Batch Candidates',
      isActive: true,
    },
  });

  console.log(`[Seed] Default Event Created: ${defaultEvent.name} (${defaultEvent.slug})`);

  // Clear existing candidate records for clean seed
  await prisma.attendance.deleteMany();
  await prisma.qrToken.deleteMany();
  await prisma.candidate.deleteMany();

  const candidatesData = [];

  // 1. Mandatory Test Cases from Prompt (GD001 - GD004)
  const testCandidates = [
    { studentId: 'GD001', name: 'Candidate A (Paid)', program: 'BE - CSE', paymentStatus: 'Paid' },
    { studentId: 'GD002', name: 'Candidate B (Not Paid)', program: 'BE - CIV', paymentStatus: 'Not Paid' },
    { studentId: 'GD003', name: 'Candidate C (Partially Paid)', program: 'BE - ECE', paymentStatus: 'Partially Paid' },
    { studentId: 'GD004', name: 'Candidate D (Typo Variation)', program: 'BE - MEC', paymentStatus: 'Partiallly Paid' },
  ];

  for (const tc of testCandidates) {
    const { normalizedStatus } = EligibilityService.normalizePaymentStatus(tc.paymentStatus);
    const eligible = EligibilityService.calculateEligibility(normalizedStatus);
    candidatesData.push({
      studentId: tc.studentId,
      name: tc.name,
      program: tc.program,
      paymentStatus: tc.paymentStatus,
      normalizedPaymentStatus: normalizedStatus,
      eligibilityStatus: eligible,
      registrationStatus: 'NOT_REGISTERED',
    });
  }

  // 2. Generate 996 candidate records (roll numbers like 2451-22-732-001 to 2451-22-769-996)
  const totalGenerate = 996;
  for (let i = 1; i <= totalGenerate; i++) {
    const rollNum = String(i).padStart(3, '0');
    const branchCode = 730 + (i % 10);
    const studentId = `2451-22-${branchCode}-${rollNum}`;

    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${fn} ${ln}`;
    const program = PROGRAMS[i % PROGRAMS.length];

    // Status distribution: ~72% Paid, ~24% Not Paid, ~4% Partially Paid
    let rawPaymentStatus = 'Paid';
    if (i % 25 === 0) {
      rawPaymentStatus = i % 50 === 0 ? 'Partiallly Paid' : 'Partially Paid';
    } else if (i % 4 !== 0) {
      rawPaymentStatus = i % 3 === 0 ? 'PAID' : 'Paid';
    } else {
      rawPaymentStatus = i % 8 === 0 ? 'not paid' : 'Not Paid';
    }

    const { normalizedStatus } = EligibilityService.normalizePaymentStatus(rawPaymentStatus);
    const eligible = EligibilityService.calculateEligibility(normalizedStatus);

    candidatesData.push({
      studentId,
      name,
      program,
      paymentStatus: rawPaymentStatus,
      normalizedPaymentStatus: normalizedStatus,
      eligibilityStatus: eligible,
      registrationStatus: 'NOT_REGISTERED',
    });
  }

  // Insert in batches of 100
  for (let i = 0; i < candidatesData.length; i += 100) {
    const batch = candidatesData.slice(i, i + 100);
    await prisma.candidate.createMany({
      data: batch,
    });
  }

  const total = await prisma.candidate.count();
  const eligibleCount = await prisma.candidate.count({ where: { eligibilityStatus: true } });
  const notEligibleCount = await prisma.candidate.count({ where: { eligibilityStatus: false } });

  console.log('---------------------------------------------------');
  console.log(`[Seed Complete] Candidate Statistics:`);
  console.log(` Total Candidates:     ${total}`);
  console.log(` Eligible Candidates:   ${eligibleCount}`);
  console.log(` Not Eligible:         ${notEligibleCount}`);
  console.log('---------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error seeding dataset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
