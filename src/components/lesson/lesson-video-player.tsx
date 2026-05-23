'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  bitmapFromBase64,
  bitmapToBase64,
  countSetBits,
  setBit,
  watchedPercent,
} from '@/lib/video/bitmap'

interface Props {
  lessonId: string
  youtubeId: string
  durationSeconds: number | null
  initialBitmapBase64: string | null
  initialWatchedPct: number
  required: boolean
  onPctChange?: (pct: number) => void
}

// YouTube IFrame API global (loaded lazily)
declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YouTubePlayer }) => void
            onStateChange?: (e: { data: number; target: YouTubePlayer }) => void
            onPlaybackRateChange?: (e: { data: number }) => void
          }
        },
      ) => YouTubePlayer
      PlayerState: {
        UNSTARTED: -1
        ENDED: 0
        PLAYING: 1
        PAUSED: 2
        BUFFERING: 3
        CUED: 5
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YouTubePlayer {
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  getPlaybackRate: () => number
  setPlaybackRate: (rate: number) => void
  destroy: () => void
}

const MAX_RATE = 1.5 // anti-cheat: cap accumulation rate
const SAMPLE_INTERVAL_MS = 1000
const SYNC_INTERVAL_MS = 15_000

let apiLoadPromise: Promise<void> | null = null
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.YT?.Player) return Promise.resolve()
  if (apiLoadPromise) return apiLoadPromise
  apiLoadPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiLoadPromise
}

export function LessonVideoPlayer({
  lessonId,
  youtubeId,
  durationSeconds,
  initialBitmapBase64,
  initialWatchedPct,
  required,
  onPctChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const bitmapRef = useRef<Uint8Array>(new Uint8Array(0))
  const dirtyRef = useRef(false)
  const durationRef = useRef<number | null>(durationSeconds)
  const lastSyncedPctRef = useRef<number>(initialWatchedPct)

  const [pct, setPct] = useState<number>(initialWatchedPct)
  const [ready, setReady] = useState(false)

  // Initialize player
  useEffect(() => {
    let cancelled = false
    let sampleTimer: ReturnType<typeof setInterval> | null = null
    let syncTimer: ReturnType<typeof setInterval> | null = null

    async function init() {
      await loadYouTubeAPI()
      if (cancelled || !containerRef.current || !window.YT) return

      // Wait one tick for DOM
      const player = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 1,
        },
        events: {
          onReady: ({ target }) => {
            playerRef.current = target
            const d = Math.floor(target.getDuration())
            if (d > 0) {
              durationRef.current = d
              bitmapRef.current = bitmapFromBase64(initialBitmapBase64, d)
              // If duration was unknown server-side, report it back so future loads compute % correctly
              if (!durationSeconds) {
                fetch(`/api/lessons/${lessonId}/video-meta`, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ durationSeconds: d }),
                }).catch(() => {})
              }
            }
            setReady(true)
          },
          onPlaybackRateChange: ({ data }) => {
            if (data > MAX_RATE) {
              // Soft cap: revert
              playerRef.current?.setPlaybackRate(MAX_RATE)
            }
          },
        },
      })
      playerRef.current = player
    }

    init()

    // Sample current time every second while playing & tab visible
    sampleTimer = setInterval(() => {
      const p = playerRef.current
      if (!p || !window.YT) return
      const state = p.getPlayerState()
      if (state !== window.YT.PlayerState.PLAYING) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      const rate = p.getPlaybackRate()
      if (rate > MAX_RATE) return

      const t = Math.floor(p.getCurrentTime())
      const dur = durationRef.current ?? 0
      if (dur <= 0) return
      setBit(bitmapRef.current, t)
      dirtyRef.current = true

      const newPct = watchedPercent(bitmapRef.current, dur)
      if (newPct !== pct) {
        setPct(newPct)
        onPctChange?.(newPct)
      }
    }, SAMPLE_INTERVAL_MS)

    // Throttle network sync
    syncTimer = setInterval(() => void syncNow(), SYNC_INTERVAL_MS)

    function onHide() {
      if (document.visibilityState === 'hidden') void syncNow()
    }
    document.addEventListener('visibilitychange', onHide)

    async function syncNow() {
      if (!dirtyRef.current) return
      const dur = durationRef.current ?? 0
      if (dur <= 0) return
      const newPct = watchedPercent(bitmapRef.current, dur)
      if (newPct === lastSyncedPctRef.current) {
        dirtyRef.current = false
        return
      }
      const payload = {
        bitmapBase64: bitmapToBase64(bitmapRef.current),
        durationSeconds: dur,
        watchedSeconds: countSetBits(bitmapRef.current),
      }
      try {
        await fetch(`/api/lessons/${lessonId}/video-progress`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        })
        lastSyncedPctRef.current = newPct
        dirtyRef.current = false
      } catch {
        // Stay dirty — retry on next tick
      }
    }

    return () => {
      cancelled = true
      if (sampleTimer) clearInterval(sampleTimer)
      if (syncTimer) clearInterval(syncTimer)
      document.removeEventListener('visibilitychange', onHide)
      // Final flush
      void syncNow()
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId, lessonId])

  const passed = pct >= 90
  const barColor = passed ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
        <div ref={containerRef} className="size-full" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">
            Tiến độ xem
            {required && <span className="ml-1 text-muted-foreground">(cần ≥90%)</span>}
          </span>
          <span className={`font-medium ${passed ? 'text-green-600' : ''}`}>
            {pct}%{passed && <CheckCircle2 className="ml-1 inline size-3.5" />}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!ready && (
          <p className="text-xs text-muted-foreground">Đang tải video…</p>
        )}
      </div>
    </div>
  )
}
