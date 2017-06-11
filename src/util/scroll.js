/* @flow */

import type Router from '../index'
import { assert } from './warn'
import { getStateKey, setStateKey } from './push-state'

const positionStore = Object.create(null)
const positionStoreEl = Object.create(null)

export function setupScroll () {
  window.addEventListener('popstate', e => {
    saveScrollPosition()
    if (e.state && e.state.key) {
      setStateKey(e.state.key)
    }
  })
}

export function handleScroll (
  router: Router,
  to: Route,
  from: Route,
  isPop: boolean
) {
  if (!router.app) {
    return
  }

  const behavior = router.options.scrollBehavior
  if (!behavior) {
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(typeof behavior === 'function', `scrollBehavior must be a function`)
  }

  // wait until re-render finishes before scrolling
  router.app.$nextTick(() => {
    let positions = getScrollPosition()
    let position = positions.position
    let positionEl = positions.positionEl
    const shouldScroll = behavior(to, from, isPop ? position : null)
    if (!shouldScroll) {
      return
    }
    const isObject = typeof shouldScroll === 'object'
    if (isObject && typeof shouldScroll.selector === 'string') {
      const el = document.querySelector(shouldScroll.selector)
      if (el) {
        position = getElementPosition(el)
      } else if (isValidPosition(shouldScroll)) {
        position = normalizePosition(shouldScroll)
      }
    } else if (isObject && isValidPosition(shouldScroll)) {
      position = normalizePosition(shouldScroll)
    }

    if (position) {
      window.scrollTo(position.x, position.y)
    }
    if (positionEl) {
      const el = to.matched[0].instances.default.$el.querySelector(to.meta.scrollSelector)
      el.scrollLeft = positionEl.scrollLeft
      el.scrollTop = positionEl.scrollTop
    }
  })
}

export function saveScrollPosition (fromRoute) {
  const key = getStateKey()
  if (key) {
    positionStore[key] = {
      x: window.pageXOffset,
      y: window.pageYOffset
    }
    if (fromRoute && fromRoute.meta.scrollSelector) {
      const el = fromRoute.matched[0].instances.default.$el.querySelector(fromRoute.meta.scrollSelector)
      positionStoreEl[key] = {
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop
      }
    }
  }
}

function getScrollPosition (): ?Object {
  const key = getStateKey()
  if (key) {
    return {
      position: positionStore[key],
      positionEl: positionStoreEl[key]
    }
  }
}

function getElementPosition (el: Element): Object {
  const docEl: any = document.documentElement
  const docRect = docEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    x: elRect.left - docRect.left,
    y: elRect.top - docRect.top
  }
}

function isValidPosition (obj: Object): boolean {
  return isNumber(obj.x) || isNumber(obj.y)
}

function normalizePosition (obj: Object): Object {
  return {
    x: isNumber(obj.x) ? obj.x : window.pageXOffset,
    y: isNumber(obj.y) ? obj.y : window.pageYOffset
  }
}

function isNumber (v: any): boolean {
  return typeof v === 'number'
}
