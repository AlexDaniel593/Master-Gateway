import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/master_gateway',
  autoLoadEntities: true,
  synchronize: true,
}));
