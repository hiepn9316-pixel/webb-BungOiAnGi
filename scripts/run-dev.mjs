import { spawn } from 'node:child_process';
import net from 'node:net';

async function findAvailablePort(preferredPort) {
  const maxAttempts = 50;

  for (let port = preferredPort; port < preferredPort + maxAttempts; port += 1) {
    const usedPort = await new Promise(resolve => {
      const server = net.createServer();
      server.once('error', () => resolve(null));
      server.listen(port, '127.0.0.1', () => {
        const { port: actualPort } = server.address();
        server.close(() => resolve(actualPort));
      });
    });

    if (usedPort !== null) return usedPort;
  }

  throw new Error('Unable to find an available local port.');
}

const preferredApiPort = Number(process.env.API_PORT || process.env.PORT || 3000);
const apiPort = await findAvailablePort(preferredApiPort);
const environment = {
  ...process.env,
  API_PORT: String(apiPort),
};

const apiProcess = spawn(process.execPath, ['server.js'], {
  stdio: 'inherit',
  env: environment,
});

const webProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  env: environment,
  shell: true,
});

const shutdown = signal => {
  apiProcess.kill(signal);
  webProcess.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

apiProcess.on('exit', code => {
  if (code !== 0) process.exit(code ?? 1);
});

webProcess.on('exit', code => {
  if (code !== 0) process.exit(code ?? 1);
});

console.log(`API server: http://127.0.0.1:${apiPort}`);
