import { describe, expect, test } from 'vitest'
import { CATEGORY_LABELS, FRAMEWORKS, FRAMEWORK_LIST, getFramework } from './frameworks'

describe('frameworks', () => {
  test('FRAMEWORK_LIST contains all four frameworks in FRAMEWORKS', () => {
    expect(FRAMEWORK_LIST).toHaveLength(Object.keys(FRAMEWORKS).length)
    expect(FRAMEWORK_LIST.map((f) => f.key).sort()).toEqual(
      ['element', 'orid', 'self', 'vts'].sort()
    )
  })

  test('every framework has at least one step with non-empty question and hints', () => {
    for (const framework of FRAMEWORK_LIST) {
      expect(framework.steps.length).toBeGreaterThan(0)
      for (const step of framework.steps) {
        expect(step.id).toBeTruthy()
        expect(step.label).toBeTruthy()
        expect(step.question).toBeTruthy()
        expect(step.hints.length).toBeGreaterThan(0)
      }
    }
  })

  test('step ids are unique within each framework', () => {
    for (const framework of FRAMEWORK_LIST) {
      const ids = framework.steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  test('getFramework returns the framework matching the given key', () => {
    expect(getFramework('vts').name).toBe('VTS')
    expect(getFramework('orid').name).toBe('ORID')
  })

  test('CATEGORY_LABELS has a label for every category used across the app', () => {
    const expectedCategories = ['movie', 'anime', 'illustration', 'photo', 'music', 'design', 'other']
    for (const category of expectedCategories) {
      expect(CATEGORY_LABELS[category]).toBeTruthy()
    }
  })
})
