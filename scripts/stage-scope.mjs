/**
 * Static guard: react-three-fiber hooks only work inside a <Canvas>.
 *
 * The Stage component renders its children through a lazily loaded Canvas, so
 * anything that calls useFrame/useThree must sit underneath it. A component
 * that calls one of those hooks and then renders a <Stage> is doing it the
 * wrong way round, and the mistake only shows up at runtime as
 * "Hooks can only be used within the Canvas component".
 *
 * This walk is deliberately shallow and text based: it reads each file, finds
 * components whose body calls an R3F hook, and fails if the same body also
 * renders a Stage. It runs in `npm test`.
 */
import fs from 'node:fs'
import path from 'node:path'

const R3F_HOOKS = /\b(useFrame|useThree)\s*\(/
const RENDERS_STAGE = /<Stage[\s>]/
const ROOT = path.join(process.cwd(), 'src')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

/** Walk from an opening bracket to its partner, ignoring strings and comments. */
function closing(source, from, open, close) {
  let depth = 0
  for (let i = from; i < source.length; i++) {
    if (source[i] === open) depth++
    else if (source[i] === close) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Top-level `function Name(...) { ... }` bodies, parameter list skipped. */
function components(source) {
  const found = []
  const pattern = /(?:export\s+)?function\s+([A-Z]\w*)\s*\(/g
  let match
  while ((match = pattern.exec(source))) {
    const paramsOpen = source.indexOf('(', match.index)
    const paramsClose = closing(source, paramsOpen, '(', ')')
    if (paramsClose === -1) continue
    const open = source.indexOf('{', paramsClose)
    if (open === -1) continue
    let depth = 0
    let end = -1
    for (let i = open; i < source.length; i++) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end === -1) continue
    found.push({ name: match[1], body: source.slice(open, end), line: source.slice(0, match.index).split('\n').length })
  }
  return found
}

const failures = []
for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8')
  for (const component of components(source)) {
    if (R3F_HOOKS.test(component.body) && RENDERS_STAGE.test(component.body)) {
      failures.push(`${path.relative(process.cwd(), file)}:${component.line} ${component.name} calls an R3F hook and renders <Stage>; move the hook into a child of the canvas`)
    }
  }
}

if (failures.length) {
  console.error('Stage scope check failed:')
  for (const failure of failures) console.error('  ' + failure)
  process.exit(1)
}
console.log(`PASS: no component mixes R3F hooks with a <Stage> boundary (${walk(ROOT).length} files)`)
