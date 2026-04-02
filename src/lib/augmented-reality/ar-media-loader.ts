import type React from "react"
import * as THREE from "three"
import { loadFrameWithContent } from "./ar-frame-loader"
import { positionMediaInScene } from "./ar-scene-objects"
import type { LocationBased } from "./locationbased-ar"
import { BeamType } from "@prisma/client"

interface MediaLoadOptions {
    onProgress?: (progress: number) => void
    onError?: (error: Error) => void
    onSuccess?: () => void
    modelScale?: number
    mixerRef?: React.MutableRefObject<THREE.AnimationMixer | null>
    modelRef?: React.MutableRefObject<THREE.Group | null>
    originalScaleRef?: React.MutableRefObject<number>
    sceneRef?: React.MutableRefObject<THREE.Scene | null>
    mediaGroupRef?: React.MutableRefObject<THREE.Group | null>
    showUnmuteButton?: boolean
    useFrame?: boolean // New option to use frame
    frameModelPath?: string // Path to GLB frame model
}

export async function loadMedia(
    qrItem: {
        type: BeamType
        url: string
        content?: string
    },
    locar: LocationBased,
    modelLat: number,
    modelLng: number,
    options?: MediaLoadOptions,
) {
    // If useFrame is enabled, load content in frame
    console.log("loadMedia called with options:", options)
    return await loadMediaInFrame(qrItem, options)

}

async function loadMediaInFrame(
    qrItem: {
        type: BeamType
        url: string
        content?: string
    },
    options?: MediaLoadOptions,
) {
    try {
        console.log(`Loading ${qrItem.type} into frame`)
        options?.onProgress?.(10)

        let contentType: BeamType = "POSTCARD"
        let contentUrl: string | undefined
        let textContent: string | undefined

        if (qrItem.type === "MESSAGE") {
            contentType = "MESSAGE"
            textContent = qrItem.content ?? "No message content"
            return await loadTextIntoScene(textContent, options)

        } else if (qrItem.type === "VIDEO") {
            contentType = "VIDEO"
            contentUrl = qrItem.url
            textContent = qrItem.content ?? "Video content"
        } else {
            console.log("Loading as image type")
            contentType = "POSTCARD"
            contentUrl = qrItem.url
            textContent = qrItem.content ?? "Image content"
        }

        const result = await loadFrameWithContent({
            frameModelPath: options?.frameModelPath ?? "/frame.glb",
            contentType,
            contentUrl,
            textContent,
            onProgress: (progress) => {
                // Map frame loading progress (10-90%)
                options?.onProgress?.(10 + (progress * 0.8))
            },
            onError: options?.onError,
        })

        const { group, video, flipFrame } = result

        // Position the frame in the scene
        positionMediaInScene(group, 5, 1.6, undefined, true)

        options?.onProgress?.(95)

        if (options?.mediaGroupRef?.current) {
            options.mediaGroupRef.current.add(group)
        }

        // Store flip function on the group for external access
        group.userData.flipFrame = flipFrame

        options?.onProgress?.(100)
        options?.onSuccess?.()

        return {
            type: qrItem.type.toUpperCase(),
            mesh: group,
            video,
            flipFrame,
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error loading media in frame")
        options?.onError?.(err)
        throw err
    }
}



async function loadTextIntoScene(text: string, options?: MediaLoadOptions) {
    const { createTextPlane } = await import("./ar-scene-objects")
    try {
        console.log(`Loading text into scene: ${text}`)
        options?.onProgress?.(25)

        const textGroup = await createTextPlane(text)
        positionMediaInScene(textGroup, 7, 1.6, undefined, true)

        options?.onProgress?.(75)

        if (options?.mediaGroupRef?.current) {
            options.mediaGroupRef.current.add(textGroup)
        }

        options?.onProgress?.(100)
        options?.onSuccess?.()

        return { type: "TEXT", mesh: textGroup }
    } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error loading text")
        options?.onError?.(err)
        throw err
    }
}