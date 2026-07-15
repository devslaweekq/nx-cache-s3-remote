'use strict';

module.exports = {
  apps: [
    {
      name: 'nx-cache-s3-remote',
      script: './dist/server.js',
      exec_mode: 'cluster',
      instances: process.env.PM2_INSTANCES || 'max',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
