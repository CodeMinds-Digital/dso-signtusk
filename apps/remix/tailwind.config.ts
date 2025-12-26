/* eslint-disable @typescript-eslint/no-var-requires */
const baseConfig = require('@signtusk/tailwind-config');
const path = require('path');

module.exports = {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    './app/**/*.{ts,tsx}',
    `${path.join(require.resolve('@signtusk/ui'), '..')}/components/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/ui'), '..')}/icons/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/ui'), '..')}/lib/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/ui'), '..')}/primitives/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/email'), '..')}/templates/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/email'), '..')}/template-components/**/*.{ts,tsx}`,
    `${path.join(require.resolve('@signtusk/email'), '..')}/providers/**/*.{ts,tsx}`,
  ],
};
