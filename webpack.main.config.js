const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// 根据 NODE_ENV 加载对应的 .env 文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, envFile);
const envConfig = dotenv.config({ path: envPath });

console.log('[Webpack Main] Loading environment from:', envFile);
console.log('[Webpack Main] Environment loaded successfully:', !envConfig.error);

// 准备要注入的环境变量
const envVars = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  'process.env.EVOLUTION_API_KEY': JSON.stringify(process.env.EVOLUTION_API_KEY || 'dev_test_key_12345'),
  'process.env.EVOLUTION_API_BASE_URL': JSON.stringify(process.env.EVOLUTION_API_BASE_URL || 'http://localhost:8080'),
  'process.env.EVOLUTION_INSTANCE_PREFIX': JSON.stringify(process.env.EVOLUTION_INSTANCE_PREFIX || 'whatsapp_'),
  'process.env.ENCRYPTION_KEY': JSON.stringify(process.env.ENCRYPTION_KEY || 'dev_encryption_key'),
};

console.log('[Webpack Main] Injected environment variables:');
Object.keys(envVars).forEach(key => {
  const value = JSON.parse(envVars[key]);
  if (key.includes('KEY')) {
    console.log(`  ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ${key}: ${value}`);
  }
});

module.exports = {
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'build/main'),
    filename: 'main.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin(envVars),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    electron: 'commonjs electron',
    keytar: 'commonjs keytar',
    'better-sqlite3': 'commonjs better-sqlite3',
    'sql.js': 'commonjs sql.js',
  },
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};