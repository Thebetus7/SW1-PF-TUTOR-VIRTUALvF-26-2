import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { SpeechService } from './speech.service';
import { LiveTutorService } from './live.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../../common/services/gemini.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('Tutor evaluation session acceptance', () => {
  let app: INestApplication;
  const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const attempt = jest.fn();
  const change = jest.fn();
  const generate = jest.fn();
  const session = { id: sessionId, userId: 'student', moduleId: 'module', nextIndex: 2, results: [false, false], question: 'Explica una función.', completed: false };
  beforeEach(async () => {
    attempt.mockReset().mockResolvedValue({ id: 'attempt' });
    change.mockReset().mockResolvedValue({ count: 1 });
    generate.mockReset().mockResolvedValue({ isCorrect: false, feedbackText: 'Repasa las funciones.', avatarEmotion: 'encouraging', speechSegments: [] });
    const tx = { tutorSession: { updateMany: change, update: jest.fn() }, exam: { findFirst: jest.fn().mockResolvedValue({ id: 'exam' }) }, examAttempt: { create: attempt } };
    const prisma = {
      tutorSession: { findUnique: jest.fn().mockResolvedValue(session) },
      module: { findUnique: jest.fn().mockResolvedValue({ id: 'module', title: 'Funciones', lessons: [0, 1, 2].map(i => ({ id: String(i), title: 'Funciones', contextText: 'Una función agrupa instrucciones.' })) }) },
      $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    };
    const service = new TutorService(prisma as unknown as PrismaService, { generateJson: generate } as unknown as GeminiService);
    const module = await Test.createTestingModule({ controllers: [TutorController], providers: [
      { provide: TutorService, useValue: service }, { provide: SpeechService, useValue: {} }, { provide: LiveTutorService, useValue: {} },
    ] }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    app = module.createNestApplication();
    app.use((req: { user?: { id: string; role: string } }, _res: unknown, next: () => void) => { req.user = { id: 'student', role: 'STUDENT' }; next(); });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterEach(async () => { await app.close(); });
  const answer = () => request(app.getHttpServer()).post('/tutor/module-evaluation/answer').send({ sessionId, moduleId: 'module', lessonIndex: 2, userResponse: 'No sé', isSimulation: true });
  it('accumulates all answers and cannot let a student disable persistence using isSimulation', async () => {
    const result = await answer().expect(200);
    expect(result.body.finalSummary.scorePercentage).toBe(0);
    expect(result.body.finalSummary.approved).toBe(false);
    expect(attempt).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ score: 0, isPassed: false }) }));
  });
  it('leaves the turn pending when the AI service fails', async () => {
    generate.mockRejectedValue(new Error('offline'));
    await answer().expect(503);
    expect(attempt).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
  it('rejects a duplicated turn before recording an attempt', async () => {
    change.mockResolvedValue({ count: 0 });
    await answer().expect(409);
    expect(attempt).not.toHaveBeenCalled();
  });
  it('rejects responses that do not identify their evaluation session', async () => {
    await request(app.getHttpServer()).post('/tutor/module-evaluation/answer').send({ moduleId: 'module', lessonIndex: 0, userResponse: 'respuesta' }).expect(400);
    expect(attempt).not.toHaveBeenCalled();
  });
});
