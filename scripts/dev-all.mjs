// 并行启动 vite dev server + Express AI 服务
// 等价于 concurrently "npm run dev" "npm run server", 但不引入额外依赖
import { spawn } from 'node:child_process'
import { platform } from 'node:os'

const isWin = platform() === 'win32'
// Windows 下用 cmd /c 调用 npm, 跨平台兼容
const npmCmd = isWin ? 'npm.cmd' : 'npm'

const procs = []

function start(name, args, color) {
  // Windows 下 spawn npm.cmd 需 shell: true, 否则会报 EINVAL
  const child = spawn(npmCmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWin,
  })
  procs.push(child)

  const prefix = `\x1b[${color}m[${name}]\x1b[0m`
  child.stdout.on('data', (d) => process.stdout.write(d.toString().split('\n').map((l) => (l ? prefix + ' ' + l : l)).join('\n')))
  child.stderr.on('data', (d) => process.stderr.write(d.toString().split('\n').map((l) => (l ? prefix + ' ' + l : l)).join('\n')))

  child.on('exit', (code) => {
    console.log(`${prefix} 进程退出, code=${code}`)
    // 任一进程退出, 关闭另一个
    procs.forEach((p) => p !== child && !p.killed && p.kill())
    process.exit(code || 0)
  })
}

console.log('\x1b[36m[dev:all] 并行启动 vite + Express AI 服务...\x1b[0m')
start('vite ', ['run', 'dev'], '36') // 青色
start('server', ['run', 'server'], '35') // 紫色

// Ctrl+C 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\x1b[33m[dev:all] 收到退出信号, 关闭所有子进程...\x1b[0m')
  procs.forEach((p) => !p.killed && p.kill())
  process.exit(0)
})


