import { execSync } from 'child_process';
import path from 'path';

export async function seedMassQueues() {
  // We execute a script we'll create in the backend
  // In playwright tests, process.cwd() is usually the project root (frontend)
  const backendDir = path.resolve(process.cwd(), '../backend');
  
  console.log('Running E2E DB seed script...');
  try {
    const output = execSync('npx ts-node scripts/seed-e2e.ts', {
      cwd: backendDir,
      env: { 
        ...process.env, 
        TEST_MODE: 'true',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5455/yq_queue',
        REDIS_URL: 'redis://localhost:6380'
      },
      stdio: 'pipe'
    });
    
    // The script prints some logs and then the JSON payload at the end
    const lines = output.toString().trim().split('\n');
    const jsonStr = lines[lines.length - 1];
    
    return JSON.parse(jsonStr); // Returns { email, password, queueIds }
  } catch (error: any) {
    console.error('Seeding failed:', error.message);
    if (error.stdout) console.error('stdout:', error.stdout.toString());
    if (error.stderr) console.error('stderr:', error.stderr.toString());
    throw error;
  }
}
