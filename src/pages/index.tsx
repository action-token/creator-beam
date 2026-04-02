"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Menu, Check, Download, ChevronDown, ArrowRight, Sparkles, Users, Coins, Award } from "lucide-react"

import { Button } from "~/components/shadcn/ui/button"
import { cn } from "~/lib/utils"
import { HomeVideoPlayer } from "~/components/common/home-video-player"
import { BountySection } from "~/components/bounty/bounty-card"
import { OrganizationSection } from "~/components/creator/organization-card"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { useSidebar } from "~/hooks/use-sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "~/components/shadcn/ui/sheet"
import { DashboardNav } from "~/components/layout/Left-sidebar/dashboard-nav"
import { LeftBottom, LeftNavigation } from "~/components/layout/Left-sidebar/sidebar"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { useRouter } from "next/navigation"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const router = useRouter()
  const features = [
    {
      title: "Verified Actions",
      description:
        "Ensure authenticity through partnerships with reputable creators and a robust verification process.",
      icon: <Check className="h-6 w-6" />,
    },
    {
      title: "Token Collection",
      description: "Build a personal portfolio of contributions, showcasing your commitment to positive change.",
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      title: "Reward System",
      description:
        "Access a diverse range of rewards, from digital badges to real-world experiences, as a testament to your impact.",
      icon: <ArrowRight className="h-6 w-6" />,
    },
    {
      title: "Community Engagement",
      description:
        "Connect with like-minded individuals and creators, fostering a network dedicated to making a difference.",
      icon: <ChevronDown className="h-6 w-6" />,
    },
  ]

  useEffect(() => {
    setMounted(true)

    // Check if user is on mobile device and redirect if so
    const handleMobileRedirect = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      if (isMobile) {
        router.push("/action")
      }
    }

    handleMobileRedirect()

    // Auto-rotate through features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  if (!mounted) return <HomePageSkeleton />

  return (
    <div className="flex h-[calc(100vh-11vh)] flex-col  bg-background text-foreground overflow-hidden">


      {/* Hero Section with Video Background */}
      <section className="relative h-full w-full overflow-hidden bg-black text-primary-foreground">
        <div className="absolute inset-0 z-0">
          {/* Mobile: Static image instead of video */}
          <div className="md:hidden">
            <Image src="/images/action/bg.png" alt="ACTION Blocks" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          {/* Desktop: Lazy-loaded video with poster image */}
          <div className="hidden h-full md:block">
            <HomeVideoPlayer src="/videos/Beam.mp4" poster="/images/action/bg.png" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        </div>

        <div className="container relative z-10 mx-auto flex h-full min-h-screen flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 inline-block rounded-full bg-primary/20 px-6 py-2 backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-primary">Introducing Beam</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-6 text-4xl font-bold leading-tight text-accent md:text-6xl lg:text-7xl"
          >
            The Complete Platform for <span className="text-secondary font-bold">Modern Communication</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-10 max-w-3xl text-lg text-primary md:text-xl"
          >
            Multi-channel messaging, AI-powered document analysis, and complete event management in a single integrated platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden rounded-full bg-primary px-8 py-6 text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90"
              onClick={() => {
                router.push("/beam")
              }}
            >
              <span className="relative z-10">Create Beam</span>
              <span className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-300 ease-in-out group-hover:translate-y-0"></span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group relative overflow-hidden rounded-full border-primary px-8 py-6 text-lg font-medium text-primary transition-all hover:text-primary-foreground"
              onClick={() => {
                router.push("/bounty")
              }}
            >
              <span className="relative z-10">Join Bounties</span>
              <span className="absolute inset-0 translate-y-full bg-primary transition-transform duration-300 ease-in-out group-hover:translate-y-0"></span>
            </Button>
          </motion.div>



        </div>
      </section>


    </div>
  )
}

interface HeaderProps {
  className?: string
  sidebarExpanded?: boolean
}

export function Header({ className, sidebarExpanded = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { setBalance, setActive } = useUserStellarAcc()
  const session = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const { isSheetOpen, setIsSheetOpen } = useSidebar()

  const bal = api.wallate.acc.getAccountBalance.useQuery(undefined, {
    onSuccess: (data) => {
      const { balances } = data
      setBalance(balances)
      setActive(true)
    },
    onError: (error) => {
      setActive(false)
    },
    enabled: session.data?.user?.id !== undefined,
  })

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsPastHero(currentScrollY > window.innerHeight * 0.5)
      setIsScrolled(currentScrollY > 20)
    }

    const handleResize = () => {
      setViewportHeight(window.innerHeight)
      setIsMobile(window.innerWidth < 768)
    }

    // Add event listeners
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)

    // Initial check
    handleScroll()
    handleResize()

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 right-0 z-50 flex h-20 w-full items-center transition-all duration-500",
        // Show header only when scrolled past hero or when slightly scrolled
        isPastHero
          ? "translate-y-0 opacity-100"
          : isScrolled
            ? "bg-transparent translate-y-0 opacity-100"
            : "-translate-y-full opacity-0",
        // Glass effect when past hero
        isPastHero && " bg-background/70 backdrop-blur-md shadow-sm",
        isMobile ? "px-4" : sidebarExpanded ? "lg:pl-64" : "lg:pl-16",
        className,
      )}
    >
      <div className="flex w-full items-center justify-center gap-4">
        {/* Center section - Navigation (desktop only) */}
        <nav className="flex w-full items-center justify-between md:gap-8 lg:gap-16">
          <ul className="flex gap-6 items-center justify-center w-full md:gap-8">
            <Button
              variant="link"
              className="p-0 text-foreground hover:text-primary transition-colors"
              onClick={() => {
                const section = document.getElementById("bounties-section")
                section?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Bounties
            </Button>
            <Button
              className="p-0 text-foreground hover:text-primary transition-colors"
              variant="link"
              onClick={() => {
                const section = document.getElementById("organizations-section")
                section?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Creators
            </Button>
            <Button
              variant="link"
              className="p-0 text-foreground hover:text-primary transition-colors"
              onClick={() => {
                const section = document.getElementById("plots-section")
                section?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Plots
            </Button>
            <Button
              variant="link"
              className="p-0 text-foreground hover:text-primary transition-colors hidden md:block"
              onClick={() => {
                const section = document.getElementById("download-section")
                section?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Download App
            </Button>

          </ul>
          {session.status === "authenticated" && (
            <Link href="/wallet-balance" className="hidden md:block ">
              <Button className="bg-primary hover:bg-primary/90 transition-colors mr-2" variant="default">
                BALANCE :<span className="block md:hidden">{bal.data?.platformAssetBal.toFixed(0)}</span>
                <span className="hidden md:block ml-2">
                  {bal.data?.platformAssetBal.toFixed(0)} {PLATFORM_ASSET.code.toUpperCase()}
                </span>
              </Button>
            </Link>
          )}
        </nav>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="link" className="md:hidden p-2">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0 h-full">
            <SheetHeader className="flex items-start justify-between bg-primary p-2 rounded-md shadow-md">
              <div className="flex items-center gap-0">
                <Image
                  alt="logo"
                  objectFit="cover"
                  src="/images/logo.png"
                  height={200}
                  width={200}
                  className="h-10 w-20"
                />
                <h1 className="relative text-xl font-bold capitalize text-black md:text-4xl">
                  <p className="">BEAM</p>
                  <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">TM</p>
                </h1>
              </div>
            </SheetHeader>
            <div className="flex h-full w-full flex-col items-center justify-between p-2 no-scrollbar overflow-y-auto">
              <div className="flex h-full w-full overflow-x-hidden flex-col py-2">
                <DashboardNav items={LeftNavigation} />
              </div>
              <div className="flex h-full w-full flex-col items-center">
                <LeftBottom />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

function HomePageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col  bg-background text-foreground">
      {/* Header Skeleton */}
      <div className="h-20 w-full  bg-background/70 backdrop-blur-md shadow-sm fixed top-0 z-50 flex items-center justify-between px-4">
        <Skeleton className="h-10 w-32" />
        <div className="hidden md:flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Hero Section Skeleton */}
      <div className="relative min-h-screen w-full overflow-hidden bg-muted">
        <div className="container relative z-10 mx-auto flex h-full min-h-screen flex-col items-center justify-center px-4 text-center">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-16 w-3/4 max-w-2xl mb-6" />
          <Skeleton className="h-8 w-full max-w-xl mb-8" />
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Skeleton className="h-14 w-40" />
            <Skeleton className="h-14 w-40" />
          </div>
        </div>
      </div>

      {/* What Are Action Tokens Section Skeleton */}
      <div className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Skeleton className="h-10 w-48 mb-6" />
              <Skeleton className="h-12 w-3/4 mb-6" />
              <Skeleton className="h-24 w-full mb-8" />

              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 rounded-xl">
                    <div className="flex items-start">
                      <Skeleton className="h-10 w-10 rounded-full mr-4" />
                      <div className="w-full">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Skeleton className="rounded-2xl h-[600px] w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section Skeleton */}
      <div className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Skeleton className="h-10 w-48 mx-auto mb-6" />
            <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
            <Skeleton className="h-8 w-full max-w-xl mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
