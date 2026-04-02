"use client"

import React, { useRef, useState, useEffect } from "react"
import { Pause, Play, Volume, VolumeX } from "lucide-react"
import { Beam } from "@prisma/client"


function VideoDisplay({ beam }: { beam: Beam }) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [volume, setVolume] = useState(1)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        const onTime = () => setProgress((v.currentTime / Math.max(1, v.duration)) * 100)
        const onLoaded = () => setDuration(v.duration || 0)
        v.addEventListener("timeupdate", onTime)
        v.addEventListener("loadedmetadata", onLoaded)
        return () => {
            v.removeEventListener("timeupdate", onTime)
            v.removeEventListener("loadedmetadata", onLoaded)
        }
    }, [])

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const v = videoRef.current
        if (!v) return
        if (v.paused) {
            v.play()
            setPlaying(true)
        } else {
            v.pause()
            setPlaying(false)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        const v = videoRef.current
        if (!v) return
        const pct = Number(e.target.value)
        const t = (pct / 100) * (v.duration || 0)
        v.currentTime = t
        setProgress(pct)
    }

    const handleVolume = (val: number) => {
        const v = videoRef.current
        setVolume(val)
        if (v) v.volume = val
        setMuted(val === 0)
    }

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const v = videoRef.current
        if (!v) return
        v.muted = !v.muted
        setMuted(v.muted)
    }

    const enterFullscreen = async (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const el = videoRef.current
        if (!el) return
        const p = (el.parentElement ?? el) as HTMLElement & { requestFullscreen?: () => Promise<void> }
        if (p.requestFullscreen) await p.requestFullscreen()
    }

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <video
                ref={videoRef}
                src={beam.contentUrl ?? undefined}
                className="w-full h-auto aspect-video  cursor-pointer"
                controls={false}
                playsInline
                onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                }}
            />

            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={togglePlay}
                    aria-label={playing ? "Pause video" : "Play video"}
                    className="bg-black text-white px-2 py-2 rounded-full"
                >
                    {playing ? <Pause /> : <Play />}
                </button>

                <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(progress)}
                    onChange={handleSeek}
                    className="flex-1"
                    aria-label="Seek"
                />

                <button onClick={toggleMute} className="bg-black text-white px-2 py-2 rounded-full" aria-label="Mute">
                    {muted || volume === 0 ? <VolumeX /> : <Volume />}
                </button>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    className="w-20"
                    aria-label="Volume"
                />

                <button onClick={enterFullscreen} className="bg-black text-white px-3 py-2 rounded-full" aria-label="Fullscreen">
                    ⛶
                </button>
            </div>
        </div>
    )
}

export default VideoDisplay