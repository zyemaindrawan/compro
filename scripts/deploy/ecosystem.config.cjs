// PM2 process file for a VPS deploy. Layout under COMPRO_HOME:
//   .env   runtime environment
//   repo/  git checkout where builds run
//   live/  the .output that is served
//   prev/  the previous .output, kept for rollback
const path = require('node:path')

const home = process.env.COMPRO_HOME || path.resolve(__dirname, '../../..')

module.exports = {
  apps: [
    {
      name: 'compro',
      cwd: home,
      script: path.join(home, 'live/server/index.mjs'),
      node_args: `--env-file=${path.join(home, '.env')}`,
      // One instance: rate limits and the public cache live in process memory.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: process.env.COMPRO_PORT || '3000',
      },
    },
  ],
}
