// ── Database Read Replica Configuration ──────────────────────
// Routes analytics/search queries to read replicas.
// Primary DB for writes, replica for reads.
// Connection string from env vars (DATABASE_READ_REPLICA_URL).

import { Pool } from 'pg';

// ── Configuration ────────────────────────────────────────────
interface ReplicaConfig {
  url: string;
  ssl: boolean;
  poolSize: number;
  statementTimeout: number;
  queryTimeout: number;
}

interface DatabaseConfig {
  primary: ReplicaConfig;
  replicas: ReplicaConfig[];
  routing: {
    readOperations: string[];
    writeOperations: string[];
    analyticsTables: string[];
    searchTables: string[];
  };
}

function parseConnectionString(url: string): { connectionString: string; ssl: boolean } {
  const sslMode = url.includes('sslmode=require') || url.includes('sslmode=verify-full');
  return { connectionString: url, ssl: sslMode ? { rejectUnauthorized: false } : false };
}

const config: DatabaseConfig = {
  primary: {
    url: process.env.DATABASE_URL || process.env.DATABASE_PRIMARY_URL || '',
    ssl: process.env.DATABASE_SSL === 'true',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000', 10),
    queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '10000', 10),
  },
  replicas: (process.env.DATABASE_READ_REPLICA_URLS || process.env.DATABASE_READ_REPLICA_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(url => {
      const { connectionString, ssl } = parseConnectionString(url);
      return {
        url: connectionString,
        ssl,
        poolSize: parseInt(process.env.DATABASE_REPLICA_POOL_SIZE || '20', 10),
        statementTimeout: parseInt(process.env.DATABASE_REPLICA_STATEMENT_TIMEOUT || '60000', 10),
        queryTimeout: parseInt(process.env.DATABASE_REPLICA_QUERY_TIMEOUT || '30000', 10),
      };
    }),
  routing: {
    readOperations: ['SELECT', 'select'],
    writeOperations: ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'],
    analyticsTables: [
      'analytics_events',
      'analytics_page_views',
      'analytics_sessions',
      'analytics_referrers',
      'analytics_devices',
    ],
    searchTables: [
      'search_index',
      'search_queries',
      'search_suggestions',
    ],
  },
};

// ── Connection Pools ─────────────────────────────────────────
class ConnectionManager {
  private primaryPool: Pool | null = null;
  private replicaPools: Pool[] = [];
  private replicaIndex = 0;

  constructor() {
    this.initPools();
  }

  private initPools() {
    if (config.primary.url) {
      this.primaryPool = new Pool({
        connectionString: config.primary.url,
        ssl: config.primary.ssl,
        max: config.primary.poolSize,
        statement_timeout: config.primary.statementTimeout,
        query_timeout: config.primary.queryTimeout,
      });
    }

    this.replicaPools = config.replicas
      .filter(r => r.url)
      .map(
        r =>
          new Pool({
            connectionString: r.url,
            ssl: r.ssl,
            max: r.poolSize,
            statement_timeout: r.statementTimeout,
            query_timeout: r.queryTimeout,
          })
      );
  }

  // ── Query Routing ─────────────────────────────────────────
  isReadQuery(sql: string): boolean {
    const trimmed = sql.trim().toUpperCase();
    return config.routing.readOperations.some(op => trimmed.startsWith(op));
  }

  isAnalyticsQuery(sql: string): boolean {
    const lower = sql.toLowerCase();
    return config.routing.analyticsTables.some(t => lower.includes(t));
  }

  isSearchQuery(sql: string): boolean {
    const lower = sql.toLowerCase();
    return config.routing.searchTables.some(t => lower.includes(t));
  }

  shouldRouteToReplica(sql: string): boolean {
    if (this.replicaPools.length === 0) return false;
    if (!this.isReadQuery(sql)) return false;
    // Route analytics and search queries to replicas preferentially
    if (this.isAnalyticsQuery(sql) || this.isSearchQuery(sql)) return true;
    // Route all SELECT queries to replicas
    return true;
  }

  // ── Get Connection ────────────────────────────────────────
  getReadConnection(): Pool {
    if (this.replicaPools.length === 0) {
      if (!this.primaryPool) throw new Error('No database connections configured');
      return this.primaryPool;
    }
    // Round-robin across replicas
    const pool = this.replicaPools[this.replicaIndex % this.replicaPools.length];
    this.replicaIndex++;
    return pool;
  }

  getWriteConnection(): Pool {
    if (!this.primaryPool) throw new Error('No primary database connection configured');
    return this.primaryPool;
  }

  // ── Query Helpers ─────────────────────────────────────────
  async readDB<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getReadConnection();
    const result = await pool.query(sql, params);
    return result.rows as T;
  }

  async writeDB<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getWriteConnection();
    const result = await pool.query(sql, params);
    return result.rows as T;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    if (this.shouldRouteToReplica(sql)) {
      return this.readDB<T>(sql, params);
    }
    return this.writeDB<T>(sql, params);
  }

  // ── Health Checks ─────────────────────────────────────────
  async checkPrimary(): Promise<boolean> {
    try {
      if (!this.primaryPool) return false;
      await this.primaryPool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async checkReplicas(): Promise<boolean[]> {
    return Promise.all(
      this.replicaPools.map(async pool => {
        try {
          await pool.query('SELECT 1');
          return true;
        } catch {
          return false;
        }
      })
    );
  }

  // ── Cleanup ───────────────────────────────────────────────
  async closeAll(): Promise<void> {
    if (this.primaryPool) await this.primaryPool.end();
    await Promise.all(this.replicaPools.map(p => p.end()));
  }
}

// ── Singleton ────────────────────────────────────────────────
let instance: ConnectionManager | null = null;

export function getConnectionManager(): ConnectionManager {
  if (!instance) {
    instance = new ConnectionManager();
  }
  return instance;
}

// ── Prisma Middleware for Read/Write Splitting ──────────────
export function createReadWriteMiddleware(connectionManager: ConnectionManager) {
  return async (params: any, next: any) => {
    const action = params.action;
    const model = params.model;

    // Determine if this is a read or write operation
    const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];
    const writeActions = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'];

    const isRead = readActions.includes(action);
    const isWrite = writeActions.includes(action);

    // For analytics/search models, always use replica for reads
    const analyticsModels = ['AnalyticsEvent', 'AnalyticsPageView', 'AnalyticsSession'];
    const searchModels = ['SearchIndex', 'SearchQuery'];

    if (isRead && (analyticsModels.includes(model) || searchModels.includes(model))) {
      // Route to replica via raw query if needed
      // In practice, Prisma doesn't natively support read replicas in middleware,
      // so this is a hook point for custom routing logic
    }

    // For write operations, ensure primary is used
    if (isWrite) {
      // Writes always go to primary — Prisma handles this by default
      // This middleware serves as documentation and extension point
    }

    return next(params);
  };
}

// ── Exports ──────────────────────────────────────────────────
export { config, ConnectionManager };
export default {
  config,
  getConnectionManager,
  createReadWriteMiddleware,
};
