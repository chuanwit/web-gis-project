// 测试用 stub: 直接读 mock 目录的 JSON, 模拟 @/api 的 getRoads/getEvents(返回 GeoJSON)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (name) => JSON.parse(readFileSync(join(root, 'mock', name), 'utf-8'))

export const getRoads = () => Promise.resolve(read('Wuhan_roads.json'))
export const getEvents = () => Promise.resolve(read('Wuhan_events.json'))
