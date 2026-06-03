/**
 * usePolling hook tests.
 * Run with: npm test (requires jest + @testing-library/react)
 *
 * These tests verify the hook contract without depending on
 * real timers or network calls.
 */

import { renderHook, act } from "@testing-library/react"
import { jest } from "@jest/globals"
import usePolling from "./usePolling.js"

describe("usePolling", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    Object.defineProperty(document, "visibilityState", {
      writable:     true,
      configurable: true,
      value:        "visible",
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("calls fn immediately on mount", () => {
    const fn = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(fn, 5000))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("calls fn again after interval", async () => {
    const fn = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(fn, 5000))

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it("does not call fn when tab is hidden", async () => {
    const fn = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(fn, 5000))

    document.visibilityState = "hidden"

    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("resumes calling fn when tab becomes visible again", async () => {
    const fn = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(fn, 5000))

    document.visibilityState = "hidden"
    document.dispatchEvent(new Event("visibilitychange"))

    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    const callsWhileHidden = fn.mock.calls.length

    document.visibilityState = "visible"
    document.dispatchEvent(new Event("visibilitychange"))

    expect(fn.mock.calls.length).toBeGreaterThan(callsWhileHidden)
  })

  it("clears interval on unmount", async () => {
    const fn            = jest.fn().mockResolvedValue(undefined)
    const clearInterval = jest.spyOn(global, "clearInterval")
    const { unmount }   = renderHook(() => usePolling(fn, 5000))

    unmount()

    expect(clearInterval).toHaveBeenCalled()
  })
})