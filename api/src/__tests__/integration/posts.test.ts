/**
 * Posts API — Integration Tests
 *
 * Tests full CRUD flow for posts via Strapi entity service.
 * Requires: running PostgreSQL + Strapi instance
 *
 * Run: npm run test -- --testPathPattern=integration
 */

import prisma from '../../lib/prisma';

// ── Setup & Teardown ─────────────────────────────────────────

const TEST_PREFIX = 'test-integration-';

beforeAll(async () => {
  // Ensure DB is connected
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test data
  await prisma.post.deleteMany({
    where: { title: { startsWith: TEST_PREFIX } },
  });
  await prisma.$disconnect();
});

// ── Post CRUD Tests ─────────────────────────────────────────

describe('Post CRUD', () => {
  let testPostId: string;

  test('create a post', async () => {
    const post = await prisma.post.create({
      data: {
        title: `${TEST_PREFIX} Integration Test Post`,
        slug: `${TEST_PREFIX}-integration-test-post`,
        content: 'This is test content for integration testing.',
        excerpt: 'Test excerpt',
        status: 'draft',
        readingTimeMinutes: 5,
        viewCount: 0,
        allowComments: true,
        featured: false,
        locale: 'en',
      },
    });

    expect(post).toBeDefined();
    expect(post.id).toBeDefined();
    expect(post.title).toBe(`${TEST_PREFIX} Integration Test Post`);
    expect(post.status).toBe('draft');
    testPostId = post.id;
  });

  test('read a post by ID', async () => {
    const post = await prisma.post.findUnique({
      where: { id: testPostId },
    });

    expect(post).toBeDefined();
    expect(post?.id).toBe(testPostId);
    expect(post?.title).toBe(`${TEST_PREFIX} Integration Test Post`);
  });

  test('update a post', async () => {
    const updated = await prisma.post.update({
      where: { id: testPostId },
      data: {
        title: `${TEST_PREFIX} Updated Title`,
        status: 'published',
        publishedAt: new Date(),
      },
    });

    expect(updated.title).toBe(`${TEST_PREFIX} Updated Title`);
    expect(updated.status).toBe('published');
    expect(updated.publishedAt).toBeDefined();
  });

  test('list posts with filters', async () => {
    const posts = await prisma.post.findMany({
      where: {
        status: 'published',
        title: { startsWith: TEST_PREFIX },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts[0].status).toBe('published');
  });

  test('delete a post', async () => {
    await prisma.post.delete({ where: { id: testPostId } });

    const deleted = await prisma.post.findUnique({
      where: { id: testPostId },
    });

    expect(deleted).toBeNull();
  });
});

// ── Post + Comments Integration ─────────────────────────────

describe('Post with Comments', () => {
  let postId: string;
  let commentId: string;

  beforeAll(async () => {
    const post = await prisma.post.create({
      data: {
        title: `${TEST_PREFIX} Post with Comments`,
        slug: `${TEST_PREFIX}-post-with-comments`,
        content: 'Post content',
        status: 'published',
        publishedAt: new Date(),
        locale: 'en',
      },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.post.delete({ where: { id: postId } }).catch(() => {});
  });

  test('add comment to post', async () => {
    const comment = await prisma.comment.create({
      data: {
        content: 'Great post!',
        postId,
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        status: 'approved',
      },
    });

    expect(comment).toBeDefined();
    expect(comment.postId).toBe(postId);
    commentId = comment.id;
  });

  test('reply to comment (threaded)', async () => {
    const reply = await prisma.comment.create({
      data: {
        content: 'Thanks for the feedback!',
        postId,
        parentId: commentId,
        authorName: 'Author',
        status: 'approved',
      },
    });

    expect(reply.parentId).toBe(commentId);

    // Verify thread
    const thread = await prisma.comment.findMany({
      where: { OR: [{ id: commentId }, { parentId: commentId }] },
      orderBy: { createdAt: 'asc' },
    });

    expect(thread.length).toBe(2);
  });

  test('add reaction to post', async () => {
    // Create a test user first
    const user = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}-reactor@test.com`,
        username: `${TEST_PREFIX}-reactor`,
        password: 'test',
        role: 'subscriber',
      },
    });

    const reaction = await prisma.reaction.create({
      data: {
        type: 'like',
        userId: user.id,
        postId,
      },
    });

    expect(reaction.type).toBe('like');
    expect(reaction.postId).toBe(postId);

    // Cleanup
    await prisma.reaction.delete({ where: { id: reaction.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

// ── Post + Analytics Integration ────────────────────────────

describe('Post Analytics', () => {
  let postId: string;

  beforeAll(async () => {
    const post = await prisma.post.create({
      data: {
        title: `${TEST_PREFIX} Analytics Post`,
        slug: `${TEST_PREFIX}-analytics-post`,
        content: 'Analytics test content',
        status: 'published',
        publishedAt: new Date(),
        viewCount: 100,
        locale: 'en',
      },
    });
    postId = post.id;

    // Create page views
    const views = Array.from({ length: 10 }, (_, i) => ({
      postId,
      ipAddress: `192.168.1.${i + 1}`,
      userAgent: 'Mozilla/5.0',
      viewedAt: new Date(Date.now() - i * 60000),
    }));
    await prisma.pageView.createMany({ data: views });

    // Create engagement
    await prisma.postEngagement.create({
      data: {
        postId,
        avgTimeOnPage: 120,
        readCompletionRate: 0.65,
        bounceRate: 0.25,
        scroll25pct: 0.95,
        scroll50pct: 0.70,
        scroll75pct: 0.45,
        scroll100pct: 0.20,
      },
    });
  });

  afterAll(async () => {
    await prisma.postEngagement.delete({ where: { postId } }).catch(() => {});
    await prisma.pageView.deleteMany({ where: { postId } });
    await prisma.post.delete({ where: { id: postId } }).catch(() => {});
  });

  test('page views counted correctly', async () => {
    const count = await prisma.pageView.count({ where: { postId } });
    expect(count).toBe(10);
  });

  test('engagement data retrieved', async () => {
    const engagement = await prisma.postEngagement.findUnique({
      where: { postId },
    });

    expect(engagement).toBeDefined();
    expect(engagement?.avgTimeOnPage).toBe(120);
    expect(engagement?.readCompletionRate).toBe(0.65);
  });

  test('top posts by views', async () => {
    const topPosts = await prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, title: true, viewCount: true },
    });

    expect(topPosts.length).toBeGreaterThanOrEqual(1);
    expect(topPosts[0].viewCount).toBeGreaterThanOrEqual(100);
  });
});
