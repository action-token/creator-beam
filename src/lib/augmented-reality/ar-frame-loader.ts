import * as THREE from "three"

import { BeamType } from "@prisma/client"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { FontLoader, TextGeometry } from "three-stdlib"

interface FrameContentOptions {
    frameModelPath: string
    contentType: BeamType
    contentUrl?: string
    textContent?: string
    onProgress?: (progress: number) => void
    onError?: (error: Error) => void
}

export async function loadFrameWithContent(
    options: FrameContentOptions
): Promise<{ group: THREE.Group; video?: HTMLVideoElement; flipFrame: () => void }> {
    const { frameModelPath, contentType, contentUrl, textContent, onProgress, onError } = options
    console.log(`Loading frame model from: ${frameModelPath}`)
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        const group = new THREE.Group()
        let video: HTMLVideoElement | undefined
        let currentRotation = 0
        let isFlipping = false

        // Load the GLB frame model
        loader.load(
            "/frame.glb",
            (gltf) => {
                Promise.resolve()
                    .then(async () => {
                        const frameModel = gltf.scene

                        // Rotate frame 90 degrees around Y axis to face towards camera
                        // Frame is thin on X axis, needs to face along Z axis
                        frameModel.rotation.y = Math.PI / 2

                        group.add(frameModel)

                        // Find the frame bounds to position content correctly
                        const box = new THREE.Box3().setFromObject(frameModel)
                        const size = box.getSize(new THREE.Vector3())
                        const center = box.getCenter(new THREE.Vector3())

                        console.log("Frame size:", size)
                        console.log("Frame center:", center)

                        // Assume frame is oriented along Z-axis
                        // Front face: positive Z, Back face: negative Z
                        const frameWidth = size.x * 0.78 // 78% of frame width for content
                        const frameHeight = size.y * 0.78 // 78% of frame height for content
                        const frameDepth = size.z

                        // Calculate frame aspect ratio (16:9)
                        const frameAspectRatio = frameWidth / frameHeight

                        // Create front content (image or video)
                        if (contentType === "POSTCARD" && contentUrl) {
                            const imageMesh = await createFramedImage(contentUrl, frameWidth, frameHeight, frameAspectRatio)
                            imageMesh.position.set(center.x, center.y, center.z + frameDepth / 2 + 0.01)
                            group.add(imageMesh)
                            onProgress?.(60)
                        } else if (contentType === "VIDEO" && contentUrl) {
                            const { mesh, videoElement } = await createFramedVideo(contentUrl, frameWidth, frameHeight, frameAspectRatio)
                            mesh.position.set(center.x, center.y, center.z + frameDepth / 2 + 0.01)
                            group.add(mesh)
                            video = videoElement
                            onProgress?.(60)
                        }

                        // Create back content (text/message on the back side)
                        if (textContent) {
                            const textMesh = await createFramedText(textContent, frameWidth, frameHeight)
                            // Position text centered on frame's back side with adjusted padding for 78% content area
                            const textPaddingX = frameWidth * 0.99
                            const textPaddingY = frameHeight * 0.5
                            const textLeftX = center.x - frameWidth / 2 + textPaddingX
                            const textTopY = center.y + frameHeight / 2 - textPaddingY
                            textMesh.position.set(textLeftX, textTopY, center.z - frameDepth / 2 - 0.01)
                            textMesh.rotation.y = Math.PI
                            group.add(textMesh)
                            onProgress?.(80)
                        }
                        onProgress?.(100)

                        // Flip function with smooth animation
                        const flipFrame = () => {
                            console.log("flipFrame called, isFlipping:", isFlipping)
                            if (isFlipping) return
                            isFlipping = true

                            const targetRotation = currentRotation + Math.PI
                            const duration = 800 // ms
                            const startTime = Date.now()
                            const startRotation = currentRotation

                            console.log("Starting flip animation from", startRotation, "to", targetRotation)

                            const animate = () => {
                                const elapsed = Date.now() - startTime
                                const progress = Math.min(elapsed / duration, 1)

                                // Ease in-out cubic
                                const eased = progress < 0.5
                                    ? 4 * progress * progress * progress
                                    : 1 - Math.pow(-2 * progress + 2, 3) / 2

                                group.rotation.y = startRotation + (targetRotation - startRotation) * eased

                                if (progress < 1) {
                                    requestAnimationFrame(animate)
                                } else {
                                    currentRotation = targetRotation
                                    isFlipping = false
                                    console.log("Flip animation complete")
                                }
                            }

                            animate()
                        }

                        // Store flip state in group userData
                        group.userData.canFlip = true
                        group.userData.flipFrame = flipFrame

                        resolve({ group, video, flipFrame })
                    })
                    .catch((error) => {
                        const err = error instanceof Error ? error : new Error("Failed to process frame content")
                        onError?.(err)
                        reject(err)
                    })
            },
            (progress) => {
                const percentComplete = (progress.loaded / progress.total) * 40 // 0-40% for model loading
                onProgress?.(percentComplete)
            },
            (error) => {
                const err = new Error(`Failed to load frame model`)
                onError?.(err)
                reject(err)
            }
        )
    })
}

async function createFramedImage(imageUrl: string, maxWidth: number, maxHeight: number, frameAspectRatio: number): Promise<THREE.Mesh> {
    return new Promise((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(
            imageUrl,
            (texture) => {
                const image = texture.image as HTMLImageElement
                const imgWidth = image.width
                const imgHeight = image.height
                const imgAspect = imgWidth / imgHeight

                // Frame aspect ratio (16:9 = 1.777...)
                // Fit the image into the frame with letterboxing if necessary
                let width = maxWidth
                let height = maxHeight

                if (imgAspect > frameAspectRatio) {
                    // Image is wider than frame - fit to width, letterbox vertically
                    width = maxWidth
                    height = maxWidth / imgAspect
                } else {
                    // Image is taller than frame - fit to height, letterbox horizontally
                    height = maxHeight
                    width = maxHeight * imgAspect
                }

                const geometry = new THREE.PlaneGeometry(width, height)
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
                const mesh = new THREE.Mesh(geometry, material)

                resolve(mesh)
            },
            undefined,
            () => reject(new Error("Failed to load image texture"))
        )
    })
}

async function createFramedVideo(
    videoUrl: string,
    maxWidth: number,
    maxHeight: number,
    frameAspectRatio: number
): Promise<{ mesh: THREE.Mesh; videoElement: HTMLVideoElement }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video")
        video.playsInline = true
        video.setAttribute("webkit-playsinline", "true")
        video.crossOrigin = "anonymous"
        video.loop = true
        video.muted = true
        video.preload = "metadata"
        video.controls = false
        video.style.display = "none"
        document.body.appendChild(video)

        const texture = new THREE.VideoTexture(video)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter

        video.onloadedmetadata = () => {
            try {
                const videoAspect = video.videoWidth / video.videoHeight

                // Frame aspect ratio - fit video into frame with letterboxing
                let width = maxWidth
                let height = maxHeight

                if (videoAspect > frameAspectRatio) {
                    // Video is wider than frame - fit to width, letterbox vertically
                    width = maxWidth
                    height = maxWidth / videoAspect
                } else {
                    // Video is taller than frame - fit to height, letterbox horizontally
                    height = maxHeight
                    width = maxHeight * videoAspect
                }

                const geometry = new THREE.PlaneGeometry(width, height)
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
                const mesh = new THREE.Mesh(geometry, material)

                const playPromise = video.play()
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log("Video autoplay succeeded")
                            setTimeout(() => {
                                video.muted = false
                            }, 500)
                        })
                        .catch((err) => {
                            console.warn("Video autoplay failed:", err)
                        })
                }

                resolve({ mesh, videoElement: video })
            } catch (error) {
                reject(new Error(`Failed to process video: ${error instanceof Error ? error.message : "Unknown"}`))
            }
        }

        video.onerror = () => {
            if (video.parentNode) document.body.removeChild(video)
            reject(new Error("Failed to load video"))
        }

        video.src = videoUrl
        video.load()

        setTimeout(() => {
            if (!video.readyState) {
                if (video.parentNode) document.body.removeChild(video)
                reject(new Error("Video loading timeout"))
            }
        }, 30000)
    })
}

async function createFramedText(text: string, maxWidth: number, maxHeight: number): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        const fontLoader = new FontLoader()

        fontLoader.load(
            "https://cdn.jsdelivr.net/npm/three@latest/examples/fonts/helvetiker_regular.typeface.json",
            (font) => {
                try {
                    const group = new THREE.Group()

                    // Calculate appropriate font size based on frame dimensions
                    const fontSize = Math.min(maxWidth, maxHeight) * 0.05
                    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.8))

                    // Word wrap
                    const words = text.split(" ")
                    const lines: string[] = []
                    let currentLine = ""

                    words.forEach((word) => {
                        if ((currentLine + word).length > maxCharsPerLine) {
                            if (currentLine) lines.push(currentLine.trim())
                            currentLine = word
                        } else {
                            currentLine += (currentLine ? " " : "") + word
                        }
                    })
                    if (currentLine) lines.push(currentLine.trim())

                    const wrappedText = lines.join("\n")

                    const textGeometry = new TextGeometry(wrappedText, {
                        font: font,
                        size: fontSize,
                        height: 0.02,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 0.005,
                        bevelSize: 0.005,
                        bevelOffset: 0,
                    })

                    textGeometry.computeBoundingBox()
                    if (textGeometry.boundingBox) {

                        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
                        const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y
                        // Scale text if it exceeds frame bounds
                        let scale = 1
                        if (textWidth > maxWidth * 0.9) {
                            scale = (maxWidth * 0.9) / textWidth
                        }
                        if (textHeight * scale > maxHeight * 0.9) {
                            scale = (maxHeight * 0.9) / textHeight
                        }

                        textGeometry.translate(
                            -textGeometry.boundingBox.min.x,
                            -textGeometry.boundingBox.min.y,
                            -(textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z) / 2
                        )
                        const material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.2,
                            roughness: 0.5,
                            emissive: 0x222222,
                            emissiveIntensity: 0.3,
                        })

                        const textMesh = new THREE.Mesh(textGeometry, material)
                        textMesh.scale.setScalar(scale)

                        group.add(textMesh)
                    }

                    resolve(group)
                } catch (error) {
                    reject(new Error(`Failed to create text: ${error instanceof Error ? error.message : "Unknown"}`))
                }
            },
            undefined,
            (error) => reject(new Error(`Failed to load font`))
        )
    })
}

