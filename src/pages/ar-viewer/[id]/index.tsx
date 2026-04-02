"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

import {
    ArrowLeft,
    AlertCircle,
    Camera,
    Smartphone,
    RefreshCw,
    Maximize2,
    Minimize2,
    Navigation,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Minus,
    Plus,
} from "lucide-react"
import * as THREE from "three"
import { DeviceOrientationControls, LocationBased, WebcamRenderer } from "~/lib/augmented-reality/locationbased-ar"
import { api } from "~/utils/api"
import { useRouter } from "next/router"
import { loadMedia } from "~/lib/augmented-reality/ar-media-loader"
import { BeamType } from "@prisma/client"


const ARViewerPage = () => {
    const router = useRouter()
    const { id } = router.query as { id: string }
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    console.log("AR Viewer - beamId:", id, "token:", token)
    // State management
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [initializationError, setInitializationError] = useState<string | null>(null)
    const [modelLoaded, setModelLoaded] = useState(false)
    const [modelError, setModelError] = useState<string | null>(null)
    const [loadingProgress, setLoadingProgress] = useState<number>(0)
    const [isLoadingModel, setIsLoadingModel] = useState(false)
    const [modelScale, setModelScale] = useState<number>(1)
    const [permissionStep, setPermissionStep] = useState<
        "requesting" | "camera" | "orientation" | "location" | "complete" | "error"
    >("requesting")
    const [retryCount, setRetryCount] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [canFlip, setCanFlip] = useState(false)
    const flipFrameRef = useRef<(() => void) | null>(null)

    // Three.js refs
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.Camera | null>(null)
    const modelRef = useRef<THREE.Group | null>(null)
    const clockRef = useRef<THREE.Clock>(new THREE.Clock())
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const locarRef = useRef<LocationBased | null>(null)
    const originalScaleRef = useRef<number>(1)
    const deviceOrientationControlsRef = useRef<DeviceOrientationControls | null>(null)
    const webcamRendererRef = useRef<WebcamRenderer | null>(null)
    const initializationRef = useRef<boolean>(false)
    const mediaGroupRef = useRef<THREE.Group | null>(null)
    const [distanceToModel, setDistanceToModel] = useState<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const animationIdRef = useRef<number | null>(null)
    const modelOffsetDistance = 5

    const requestDeviceOrientationPermission = async () => {
        return new Promise<boolean>((resolve) => {
            const permissionButton = document.createElement("button")
            permissionButton.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; max-width: 320px; margin: 16px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #333;">Enable Device Motion</h2>
            <p style="color: #666; margin-bottom: 20px; font-size: 14px;">AR requires access to your device's motion sensors to track orientation.</p>
            <div style="background: #007AFF; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;">Allow Motion Access</div>
          </div>
        </div>
      `
            permissionButton.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; background: transparent; z-index: 10000; cursor: pointer;`
            document.body.appendChild(permissionButton)

            permissionButton.onclick = async () => {
                try {
                    const tempCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
                    const tempControls = new DeviceOrientationControls(tempCamera)

                    if (tempControls.requiresPermission()) {
                        const granted = await tempControls.requestPermissions()
                        tempControls.dispose()
                        document.body.removeChild(permissionButton)
                        resolve(granted)
                    } else {
                        tempControls.dispose()
                        document.body.removeChild(permissionButton)
                        resolve(true)
                    }
                } catch (error) {
                    document.body.removeChild(permissionButton)
                    resolve(false)
                }
            }
        })
    }

    const requestPermissions = async () => {
        try {
            setInitializationError(null)
            setPermissionStep("requesting")

            setPermissionStep("camera")
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            stream.getTracks().forEach((track) => track.stop())

            setPermissionStep("orientation")
            const orientationGranted = await requestDeviceOrientationPermission()
            if (!orientationGranted) throw new Error("Device orientation permission denied")

            setPermissionStep("location")
            try {
                await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000,
                    })
                })
            } catch (locationError) {
                console.warn("Location permission denied, but continuing...")
            }

            setPermissionStep("complete")
            await new Promise((resolve) => setTimeout(resolve, 500))
            return true
        } catch (error) {
            setInitializationError(`Permission denied: ${error instanceof Error ? error.message : "Unknown error"}`)
            setPermissionStep("error")
            return false
        }
    }

    const handleStartPermissions = async () => {
        setIsInitializing(true)
        await requestPermissions()
    }

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371e3
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lng2 - lng1) * Math.PI) / 180
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const calculateOffsetPosition = (lat: number, lng: number, bearing: number, distance: number) => {
        const R = 6371e3
        const δ = distance / R
        const θ = (bearing * Math.PI) / 180

        const φ1 = (lat * Math.PI) / 180
        const λ1 = (lng * Math.PI) / 180

        const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
        const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))

        return {
            lat: (φ2 * 180) / Math.PI,
            lng: (λ2 * 180) / Math.PI,
        }
    }

    const initializeCamera = () => {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.set(0, 1.6, 0)
        return camera
    }

    const initializeRenderer = () => {
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        return renderer
    }

    const setupLighting = (scene: THREE.Scene) => {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        scene.add(ambientLight)
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5)
        directionalLight1.position.set(10, 10, 10)
        directionalLight1.castShadow = true
        directionalLight1.shadow.mapSize.width = 2048
        directionalLight1.shadow.mapSize.height = 2048
        scene.add(directionalLight1)
    }
    const increaseModelSize = () => {
        if (mediaGroupRef.current && mediaGroupRef.current.children.length > 0) {
            const newScale = Math.min(modelScale * 1.15, 8)
            setModelScale(newScale)
            const scaleFactor = newScale / modelScale
            mediaGroupRef.current.children.forEach((child) => {
                child.scale.multiplyScalar(scaleFactor)
            })
        }
    }




    const decreaseModelSize = () => {
        if (mediaGroupRef.current && mediaGroupRef.current.children.length > 0) {
            const newScale = Math.max(modelScale * 0.85, 0.2)
            setModelScale(newScale)
            const scaleFactor = newScale / modelScale
            mediaGroupRef.current.children.forEach((child) => {
                child.scale.multiplyScalar(scaleFactor)
            })
        }
    }

    const handleFlipCard = () => {
        console.log("Flip button clicked, flipFrameRef.current:", flipFrameRef.current)
        if (flipFrameRef.current) {
            flipFrameRef.current()
        }
    }



    const initializeAR = async () => {
        if (initializationRef.current) return
        initializationRef.current = true

        let cleanup: (() => void) | undefined

        try {
            const permissionsGranted = await requestPermissions()
            if (!permissionsGranted) {
                initializationRef.current = false
                return
            }

            const camera = initializeCamera()
            cameraRef.current = camera

            const renderer = initializeRenderer()
            if (containerRef.current) {
                containerRef.current.appendChild(renderer.domElement)
            } else {
                document.body.appendChild(renderer.domElement)
            }
            rendererRef.current = renderer

            const scene = new THREE.Scene()
            scene.background = null // Make background transparent for WebcamRenderer
            sceneRef.current = scene

            const mediaGroup = new THREE.Group()
            mediaGroupRef.current = mediaGroup
            scene.add(mediaGroup)

            setupLighting(scene)

            const locar = new LocationBased(scene, camera, { gpsMinDistance: 1, gpsMinAccuracy: 100 })
            locarRef.current = locar

            const cam = new WebcamRenderer(renderer)
            webcamRendererRef.current = cam

            const deviceOrientationControls = new DeviceOrientationControls(camera)
            deviceOrientationControlsRef.current = deviceOrientationControls

            if (deviceOrientationControls.requiresPermission()) {
                const success = await deviceOrientationControls.init()
                if (!success) throw new Error("Failed to initialize device orientation controls")
            }

            const handleResize = () => {
                renderer.setSize(window.innerWidth, window.innerHeight)
                camera.aspect = window.innerWidth / window.innerHeight
                camera.updateProjectionMatrix()
            }

            window.addEventListener("resize", handleResize)
            window.addEventListener("orientationchange", () => setTimeout(handleResize, 100))

            let firstLocation = true

            locar.on("gpsupdate", async (pos: GeolocationPosition) => {
                const { latitude, longitude } = pos.coords

                if (firstLocation) {
                    const modelPos = calculateOffsetPosition(latitude, longitude, 0, modelOffsetDistance)

                    setIsLoadingModel(true)
                    try {
                        const media = await loadMedia({
                            type: data?.beam?.type ?? "POSTCARD",
                            url: data?.beam?.contentUrl ?? "",
                            content: data?.beam?.message ?? "",
                        }, locar, modelPos.lat, modelPos.lng, {
                            onProgress: setLoadingProgress,
                            onError: (error) => {
                                console.error("Media load error:", error)
                                setModelError(`Failed to load media: ${error.message}`)
                                setIsLoadingModel(false)
                            },
                            onSuccess: () => {
                                console.log("Media loaded successfully")
                                setModelLoaded(true)
                                setIsLoadingModel(false)
                                setLoadingProgress(100)
                            },
                            modelScale,
                            mixerRef,
                            modelRef,
                            originalScaleRef,
                            sceneRef,
                            mediaGroupRef,
                            showUnmuteButton: false,
                        })

                        // If the loaded media includes a video element, keep a reference so UI controls can manage it
                        // ignore types error

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        if (media && (media as any).video) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                            videoRef.current = (media as any).video as HTMLVideoElement
                            setIsPlaying(!videoRef.current.paused)
                        }

                        // Store flip function if available (for frame-based content)
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        if (media && (media as any).flipFrame) {
                            console.log("Flip function found, storing in ref")
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                            flipFrameRef.current = (media as any).flipFrame as (() => void)
                            setCanFlip(true)
                        } else {
                            console.log("No flip function in media object")
                        }
                    } catch (error) {
                        console.error("Media loading caught error:", error)
                        setModelError(`Failed to load media: ${error instanceof Error ? error.message : "Unknown error"}`)
                        setIsLoadingModel(false)
                    }

                    firstLocation = false
                    setIsInitializing(false)
                }

                if (mediaGroupRef.current?.userData?.lat && mediaGroupRef.current?.userData?.lng) {
                    const distance = calculateDistance(
                        latitude,
                        longitude,
                        mediaGroupRef.current.userData.lat as number,
                        mediaGroupRef.current.userData.lng as number,
                    )
                    setDistanceToModel(distance)
                }
            })

            locar.on("gpserror", (error: number) => {
                let errorMessage = "GPS error occurred."
                if (error === 1) errorMessage = "GPS permission denied. Please enable location services."
                if (error === 2) errorMessage = "GPS position unavailable. Please check your connection."
                if (error === 3) errorMessage = "GPS timeout. Please try again."
                setInitializationError(errorMessage)
            })

            const gpsStarted = locar.startGps()
            if (!gpsStarted) {
                setInitializationError("Failed to start GPS. Please check location permissions.")
                return
            }

            const animate = () => {
                cam.update()
                deviceOrientationControls.update()

                // Update position of direct children in mediaGroup that are camera-locked
                mediaGroupRef.current?.children.forEach((object) => {
                    if (object.userData.cameraLocked && cameraRef.current) {
                        const distance = (object.userData.cameraDistance as number) ?? 5
                        const height = (object.userData.cameraHeight as number) ?? 1.6

                        // Store the current Y rotation (for flip animation)
                        const currentYRotation = object.rotation.y

                        object.position.copy(cameraRef.current.position)
                        object.position.y = height
                        object.position.z -= distance

                        object.lookAt(cameraRef.current.position)

                        // Restore the Y rotation to preserve flip animation
                        object.rotation.y = currentYRotation
                    }
                })

                renderer.render(scene, camera)
                requestAnimationFrame(animate)
            }
            animate()

            cleanup = () => {
                window.removeEventListener("resize", handleResize)
                if (mixerRef.current) {
                    mixerRef.current.stopAllAction()
                    mixerRef.current = null
                }
                if (locarRef.current) {
                    locarRef.current.stopGps()
                    locarRef.current = null
                }
                if (deviceOrientationControlsRef.current) {
                    deviceOrientationControlsRef.current.dispose()
                    deviceOrientationControlsRef.current = null
                }
                if (webcamRendererRef.current) {
                    webcamRendererRef.current.dispose()
                    webcamRendererRef.current = null
                }
                renderer.dispose()
                if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
                    containerRef.current.removeChild(renderer.domElement)
                } else if (document.body.contains(renderer.domElement)) {
                    document.body.removeChild(renderer.domElement)
                }
            }
        } catch (error) {
            setInitializationError(`Failed to initialize AR: ${error instanceof Error ? error.message : "Unknown error"}`)
            setIsInitializing(false)
        } finally {
            initializationRef.current = false
        }

        return cleanup
    }

    const { data, isLoading: isLoadingBeam, error: beamError } = api.beam.getBeamWithToken.useQuery(
        { id: id, token: token },
        {
            enabled: !!id && typeof id === 'string',
            retry: 3,
            retryDelay: 1000,
        }
    )


    // When a beam is loaded, start the permission flow automatically
    useEffect(() => {
        if (!data?.beam) return
        if (permissionStep === "requesting" && isInitializing) {
            void handleStartPermissions()
        }
    }, [data?.beam, permissionStep, isInitializing])
    useEffect(() => {
        if (!data?.beam || permissionStep !== "complete") return

        void initializeAR()

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
        }
    }, [data?.beam, permissionStep])
    // Permission Screen Component
    const getStepConfig = () => {
        const configs = {
            requesting: {
                icon: <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />,
                title: "Initializing AR Experience",
                message: "Preparing augmented reality environment..."
            },
            camera: {
                icon: <Camera className="w-16 h-16 text-blue-500 animate-pulse" />,
                title: "Camera Access Required",
                message: "We need camera access to show AR content in your environment"
            },
            orientation: {
                icon: <Smartphone className="w-16 h-16 text-blue-500 animate-bounce" />,
                title: "Motion Sensors Required",
                message: "Allow motion sensors to track your device orientation"
            },
            location: {
                icon: <Navigation className="w-16 h-16 text-blue-500 animate-pulse" />,
                title: "Location Access",
                message: "Location helps position AR content accurately"
            },
            complete: {
                icon: <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />,
                title: "Setup Complete",
                message: "AR experience is ready"
            },
            error: {
                icon: <AlertCircle className="w-16 h-16 text-red-500" />,
                title: "Setup Error",
                message: "An error occurred during setup"
            }
        }
        return configs[permissionStep]
    }

    if (isInitializing && permissionStep !== "complete") {
        const config = getStepConfig()
        const stepProgress = permissionStep === 'requesting' ? 25 : permissionStep === 'camera' ? 50 : permissionStep === 'orientation' ? 75 : 100

        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 p-4">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="p-4 bg-blue-50 rounded-full">
                            {config.icon}
                        </div>
                        <h2 className="text-2xl font-bold ">{config.title}</h2>
                        <p className="text-gray-600 text-base leading-relaxed">{config.message}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                style={{ width: `${stepProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
                            <span className={permissionStep === 'requesting' ? 'text-blue-600 font-semibold' : ''}>Setup</span>
                            <span>→</span>
                            <span className={permissionStep === 'camera' ? 'text-blue-600 font-semibold' : ''}>Camera</span>
                            <span>→</span>
                            <span className={permissionStep === 'orientation' ? 'text-blue-600 font-semibold' : ''}>Motion</span>
                        </div>
                        <div className="w-full space-y-3 pt-4">
                            <button
                                onClick={handleStartPermissions}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {isLoadingModel && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-2 border-4 border-purple-400 rounded-full border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                            </div>
                            <h2 className="text-xl font-bold ">Loading AR Experience</h2>
                            <p className="text-gray-600 text-sm">Preparing your augmented reality content...</p>
                            <div className="w-full space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                                <p className="text-sm font-semibold text-gray-700">{loadingProgress.toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={containerRef} className="w-full h-screen" />

            {/* AR Controls */}
            <button
                onClick={() => router.back()}
                className="absolute left-4 top-4 z-50 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg border border-white/10"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            {/* Zoom Controls */}
            <div className="absolute right-4 bottom-14 z-50 flex flex-col space-y-3">
                <div className="bg-black/70 backdrop-blur-md rounded-full p-2 space-y-2 shadow-lg border border-white/10">
                    <button
                        onClick={increaseModelSize}
                        className="text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 block w-full"
                        title="Zoom In"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <div className="w-full h-px bg-white/20"></div>
                    <button
                        onClick={decreaseModelSize}
                        className="text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 block w-full"
                        title="Zoom Out"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Flip Card Button */}
            {canFlip && (
                <button
                    onClick={handleFlipCard}
                    className="absolute right-4 top-4 z-50 bg-blue-600/90 hover:bg-blue-700 backdrop-blur-md text-white px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg border border-blue-400/30 font-semibold text-sm"
                    title="Flip Card"
                >
                    Flip Card
                </button>
            )}


        </>
    )
}

export default ARViewerPage
