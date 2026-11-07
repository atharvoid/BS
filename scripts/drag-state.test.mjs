import assert from 'node:assert/strict'
import test from 'node:test'
import { createDrag } from '../src/three/drag.ts'

/* The drag state, tested through the handlers a scene actually binds.
 *
 * This is the part of touch handling that cannot be checked by swiping at a
 * page: whether a cancelled pointer leaves the scene armed, whether a second
 * finger hijacks a drag that is already running, whether the capture is always
 * given back. A stuck capture is invisible in a screenshot and obvious to a
 * visitor — the page stops scrolling.
 */

/** A pointer event as the handlers read it. */
function pointer(overrides = {}) {
  return {
    pointerId: 1,
    button: 0,
    isPrimary: true,
    clientX: 0,
    clientY: 0,
    target: null,
    ...overrides,
  }
}

/** A capture target that records what it was asked to do. */
function captureTarget() {
  const log = []
  return {
    log,
    el: {
      setPointerCapture: (id) => log.push(['set', id]),
      releasePointerCapture: (id) => log.push(['release', id]),
    },
  }
}

function started() {
  const drag = createDrag()
  const { log, el } = captureTarget()
  const bind = drag.bind()
  bind.onPointerDown(pointer({ target: el, clientX: 100, clientY: 100 }))
  return { drag, bind, log, el }
}

test('a drag claims the pointer once and gives it back on release', () => {
  const { drag, bind, log, el } = started()
  assert.deepEqual(log, [['set', 1]])
  assert.equal(drag.dragging, true)

  bind.onPointerUp(pointer({ target: el }))
  assert.deepEqual(log, [['set', 1], ['release', 1]])
  assert.equal(drag.dragging, false)
})

test('a cancelled pointer leaves nothing armed', () => {
  /* This is the interruption the browser performs for us: a system gesture, a
     second finger, the tab going away. If the state stays armed, the object
     keeps turning on pointer moves that belong to the page. */
  const { drag, bind, log, el } = started()
  bind.onPointerMove(pointer({ target: el, clientX: 160, clientY: 100 }))
  bind.onPointerCancel(pointer({ target: el }))

  assert.equal(drag.dragging, false, 'still dragging after a cancel')
  assert.deepEqual(log[log.length - 1], ['release', 1], 'capture must be released')
  assert.equal(drag.velocity.x, 0, 'a cancelled drag must not coast')
  assert.equal(drag.velocity.y, 0)

  /* And a stray move afterwards is ignored rather than resuming. */
  const before = drag.target.y
  bind.onPointerMove(pointer({ target: el, clientX: 300, clientY: 100 }))
  assert.equal(drag.target.y, before)
})

test('a second pointer cannot take over a drag already running', () => {
  const { drag, bind } = started()
  const { log, el } = captureTarget()
  bind.onPointerDown(pointer({ pointerId: 2, target: el }))
  assert.equal(log.length, 0, 'the second pointer must not capture')
  assert.equal(drag.dragging, true)
})

test('a non-primary pointer is ignored', () => {
  /* A second finger during a pinch reports `isPrimary: false`; turning the
     object from it would fight the zoom. */
  const drag = createDrag()
  const { log, el } = captureTarget()
  drag.bind().onPointerDown(pointer({ isPrimary: false, target: el }))
  assert.equal(log.length, 0)
  assert.equal(drag.dragging, false)
})

test('a right-click does not start a drag', () => {
  const drag = createDrag()
  const { log, el } = captureTarget()
  drag.bind().onPointerDown(pointer({ button: 2, target: el }))
  assert.equal(log.length, 0)
})

test('a horizontal drag turns the object and a vertical one tilts it, within limits', () => {
  const { drag, bind, el } = started()
  bind.onPointerMove(pointer({ target: el, clientX: 200, clientY: 100 }))
  assert.ok(drag.target.y > 0, 'a rightward drag should turn the object')

  /* The tilt is clamped: an object cannot be turned over its own top edge. */
  for (let i = 0; i < 200; i += 1) {
    bind.onPointerMove(pointer({ target: el, clientX: 200, clientY: 100 + i * 20 }))
  }
  assert.ok(Math.abs(drag.target.x) <= 0.44 + 1e-9, `tilt escaped its limit: ${drag.target.x}`)
})

test('the drag can be stopped from outside, at any moment', () => {
  /* What a menu opening, a route change or a hidden tab does. */
  const { drag, bind, log, el } = started()
  bind.onPointerMove(pointer({ target: el, clientX: 180, clientY: 100 }))
  drag.cancel()
  assert.equal(drag.dragging, false)
  assert.deepEqual(log[log.length - 1], ['release', 1])
})

test('resetting returns the object to rest without leaving state behind', () => {
  const { drag, bind, el } = started()
  bind.onPointerMove(pointer({ target: el, clientX: 180, clientY: 130 }))
  drag.reset()
  assert.equal(drag.dragging, false)
  assert.equal(drag.target.y, 0)
  assert.equal(drag.target.x, 0)
  assert.equal(drag.current.y, 0)
  assert.equal(drag.touched, false)
})

test('a release is not double-counted when the pointer also leaves', () => {
  const { drag, bind, log, el } = started()
  bind.onPointerUp(pointer({ target: el }))
  const releases = log.filter(([kind]) => kind === 'release').length
  bind.onPointerLeave(pointer({ target: el }))
  assert.equal(log.filter(([kind]) => kind === 'release').length, releases)
  assert.equal(drag.dragging, false)
})
