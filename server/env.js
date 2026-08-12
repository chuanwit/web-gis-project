// 简易 .env 加载器(避免引入 dotenv 依赖)
// 支持 KEY=VALUE, 忽略注释(#)和空行
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function loadEnv() {
  const envPath = path.resolve(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    // 匹配 KEY=VALUE, 跳过注释和空行
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) return
    const key = m[1]
    let val = m[2].trim()
    // 去掉两侧引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    // 不覆盖已存在的环境变量(让系统 env 优先)
    if (!process.env[key]) {
      process.env[key] = val
    }
  })
}
