import request from 'supertest';
import { createApp } from '../app';
import { seedInitialData } from '../seeds/seed';

const app = createApp();

beforeAll(async () => {
  await seedInitialData();
});

describe('FactCheck AI - REST API Endpoints', () => {
  let authToken = '';
  let moderatorToken = '';

  test('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toContain('FactCheck AI');
  });

  test('POST /api/auth/register creates user and returns JWT', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Rohan Verma',
      email: `rohan_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      role: 'user',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  test('POST /api/auth/demo-switch retrieves moderator token', async () => {
    const res = await request(app).post('/api/auth/demo-switch').send({
      role: 'moderator',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    moderatorToken = res.body.data.token;
  });

  test('POST /api/verify/text verifies text claim', async () => {
    const res = await request(app)
      .post('/api/verify/text')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        text: 'PIB Fact Check debunks Rs 50,000 viral student grant circular.',
        inputType: 'text',
      });

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBeDefined();
    expect(res.body.confidence).toBeDefined();
    expect(res.body.sources).toBeInstanceOf(Array);
  });

  test('GET /api/news returns categorized verified news', async () => {
    const res = await request(app).get('/api/news');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  test('GET /api/news/daily-briefing returns morning briefing', async () => {
    const res = await request(app)
      .get('/api/news/daily-briefing')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.briefing.stories).toBeDefined();
  });

  test('POST /api/chat handles AI assistant messages', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'How does FactCheck AI detect fake news?',
        mode: 'general',
      });

    expect(res.status).toBe(200);
    expect(res.body.message.content).toBeDefined();
  });

  test('GET /api/moderation/queue allows moderator access', async () => {
    const res = await request(app)
      .get('/api/moderation/queue')
      .set('Authorization', `Bearer ${moderatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
  });
});
