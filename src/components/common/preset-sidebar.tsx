"use client"

import { useState } from "react"
import { ChevronRight, X } from "lucide-react"

interface Preset {
  id: string
  name: string
  icon: string
  description: string
  prompts: string[]
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

interface PresetCategory {
  id: string
  name: string
  icon: string
  presets: Preset[]
  comingSoon?: boolean
}

const presetCategories: PresetCategory[] = [
  {
    id: "christmas",
    name: "Christmas",
    icon: "🎄",
    presets: [
      {
        id: "cozy-christmas",
        name: "Cozy Christmas",
        icon: "🏠",
        description: "Warm fireplace, stockings, hot cocoa vibes",
        prompts: [
          "Transform into a cozy Christmas scene with warm fireplace glow, hanging stockings, and soft snow falling outside the window",
          "Add festive Christmas decorations, twinkling lights, and a warm holiday atmosphere",
        ],
        colors: { primary: "#8B0000", secondary: "#228B22", accent: "#FFD700" },
      },
      {
        id: "winter-wonderland",
        name: "Winter Wonderland",
        icon: "❄️",
        description: "Snowy landscapes and magical frost",
        prompts: [
          "Transform into a magical winter wonderland with glistening snow, frost-covered trees, and soft blue winter light",
          "Add sparkling snowflakes, icy crystals, and a dreamy winter atmosphere",
        ],
        colors: { primary: "#4169E1", secondary: "#E0FFFF", accent: "#C0C0C0" },
      },
      {
        id: "santas-workshop",
        name: "Santa's Workshop",
        icon: "🎅",
        description: "Elves, toys, and North Pole magic",
        prompts: [
          "Transform into Santa's magical workshop with busy elves, wrapped presents, and festive red and green decorations",
          "Add toy-making scenes, candy canes, and warm workshop lighting",
        ],
        colors: { primary: "#DC143C", secondary: "#228B22", accent: "#FFD700" },
      },
      {
        id: "nutcracker",
        name: "Nutcracker Ballet",
        icon: "🩰",
        description: "Elegant, classical holiday magic",
        prompts: [
          "Transform into an elegant Nutcracker ballet scene with sugarplum fairies, toy soldiers, and magical snowflakes",
          "Add theatrical lighting, rich velvet curtains, and golden accents",
        ],
        colors: { primary: "#800080", secondary: "#FFD700", accent: "#C0C0C0" },
      },
      {
        id: "gingerbread",
        name: "Gingerbread House",
        icon: "🍪",
        description: "Sweet treats and candy decorations",
        prompts: [
          "Transform into a whimsical gingerbread house scene with candy cane pillars, gumdrop decorations, and icing snow",
          "Add sweet treats, colorful candies, and warm baking glow",
        ],
        colors: { primary: "#8B4513", secondary: "#FF69B4", accent: "#FFFFFF" },
      },
      {
        id: "nordic-christmas",
        name: "Nordic Christmas",
        icon: "🦌",
        description: "Scandinavian minimalist holiday",
        prompts: [
          "Transform into a Nordic Christmas scene with minimalist decorations, natural wood elements, and soft candlelight",
          "Add simple evergreen branches, white and red accents, and cozy hygge atmosphere",
        ],
        colors: { primary: "#8B0000", secondary: "#F5F5DC", accent: "#228B22" },
      },
    ],
  },
  {
    id: "everyday",
    name: "Everyday",
    icon: "🌟",
    presets: [
      {
        id: "congratulations",
        name: "Congratulations",
        icon: "🎉",
        description: "Celebrate achievements and success",
        prompts: [
          "Transform into a celebratory scene with confetti, sparkles, and achievement elements like trophies and ribbons",
          "Add congratulatory atmosphere with bright, uplifting colors and success-themed decorations",
        ],
        colors: { primary: "#FFD700", secondary: "#FF6B6B", accent: "#4ECDC4" },
      },
      {
        id: "get-well",
        name: "Get Well Soon",
        icon: "💐",
        description: "Send healing wishes and comfort",
        prompts: [
          "Transform into a comforting get-well scene with soft flowers, warm sunshine, and peaceful healing vibes",
          "Add gentle colors, blooming flowers, butterflies, and soothing, restorative atmosphere",
        ],
        colors: { primary: "#87CEEB", secondary: "#FFB6C1", accent: "#98FB98" },
      },
      {
        id: "thank-you",
        name: "Thank You",
        icon: "🙏",
        description: "Express gratitude and appreciation",
        prompts: [
          "Transform into a grateful scene with warm golden light, elegant thank you elements, and heartfelt appreciation vibes",
          "Add graceful decorations, soft ribbons, and warm, appreciative atmosphere",
        ],
        colors: { primary: "#DEB887", secondary: "#F0E68C", accent: "#D2691E" },
      },
      {
        id: "thinking-of-you",
        name: "Thinking of You",
        icon: "💭",
        description: "Show you care and remember",
        prompts: [
          "Transform into a thoughtful scene with gentle clouds, soft pastels, and caring elements like hearts and flowers",
          "Add tender, affectionate atmosphere with dreamy, comforting vibes",
        ],
        colors: { primary: "#E6E6FA", secondary: "#FFB6D9", accent: "#B0E0E6" },
      },
      {
        id: "good-luck",
        name: "Good Luck",
        icon: "🍀",
        description: "Send positive energy and wishes",
        prompts: [
          "Transform into a lucky scene with four-leaf clovers, horseshoes, shooting stars, and good fortune symbols",
          "Add energetic, optimistic atmosphere with bright greens and golden accents",
        ],
        colors: { primary: "#32CD32", secondary: "#FFD700", accent: "#00CED1" },
      },
      {
        id: "welcome",
        name: "Welcome",
        icon: "👋",
        description: "Greet newcomers warmly",
        prompts: [
          "Transform into a welcoming scene with open doors, friendly elements, and warm, inviting atmosphere",
          "Add cheerful greetings, balloons, and hospitable, friendly vibes",
        ],
        colors: { primary: "#FF7F50", secondary: "#FFE4B5", accent: "#87CEEB" },
      },
      {
        id: "miss-you",
        name: "Miss You",
        icon: "💌",
        description: "Express longing and connection",
        prompts: [
          "Transform into a nostalgic scene with soft memories, distant stars, and heartfelt longing atmosphere",
          "Add sentimental elements, warm glow, and emotional connection vibes",
        ],
        colors: { primary: "#9370DB", secondary: "#FFB6C1", accent: "#FFA07A" },
      },
      {
        id: "just-because",
        name: "Just Because",
        icon: "💝",
        description: "Spontaneous love and kindness",
        prompts: [
          "Transform into a spontaneous, joyful scene with playful elements, surprise touches, and lighthearted atmosphere",
          "Add whimsical decorations, bright colors, and cheerful, unexpected delight vibes",
        ],
        colors: { primary: "#FF69B4", secondary: "#FFD700", accent: "#00BFFF" },
      },
    ],
  },
  {
    id: "hanukkah",
    name: "Hanukkah",
    icon: "🕎",
    presets: [
      {
        id: "menorah-lighting",
        name: "Menorah Lighting",
        icon: "🕎",
        description: "Glowing candles, warm light, sacred celebration",
        prompts: [
          "Transform into a warm Hanukkah scene with a glowing menorah with eight candles plus shamash, soft candlelight, blue and white decorations",
          "Add peaceful celebration atmosphere, sacred Jewish symbols, and warm family gathering vibes",
        ],
        colors: { primary: "#3b82f6", secondary: "#dbeafe", accent: "#c0c0c0" },
      },
      {
        id: "dreidel-celebration",
        name: "Dreidel Celebration",
        icon: "🎲",
        description: "Spinning dreidels, gelt coins, playful fun",
        prompts: [
          "Transform into a festive Hanukkah scene with colorful dreidels spinning, chocolate gelt coins, playful atmosphere",
          "Add blue and silver decorations, joyful family gathering, and traditional game celebration vibes",
        ],
        colors: { primary: "#60a5fa", secondary: "#fbbf24", accent: "#a78bfa" },
      },
      {
        id: "star-of-david",
        name: "Star of David",
        icon: "✡️",
        description: "Sacred symbols, spiritual light, elegance",
        prompts: [
          "Transform into an elegant Hanukkah scene with Stars of David, shimmering blue and silver colors, starlight",
          "Add sacred Jewish symbols, spiritual celebration atmosphere, and divine light",
        ],
        colors: { primary: "#2563eb", secondary: "#93c5fd", accent: "#e0e7ff" },
      },
      {
        id: "latkes-feast",
        name: "Latkes & Feast",
        icon: "🥔",
        description: "Traditional foods, family table, delicious",
        prompts: [
          "Transform into a delicious Hanukkah feast scene with golden latkes, sufganiyot donuts, festive table setting",
          "Add warm family gathering, celebration of traditional foods, and abundant feast atmosphere",
        ],
        colors: { primary: "#f59e0b", secondary: "#3b82f6", accent: "#fef3c7" },
      },
      {
        id: "eight-nights",
        name: "Eight Nights",
        icon: "🕯️",
        description: "Progressive candles, growing light, miracles",
        prompts: [
          "Transform into a symbolic Hanukkah scene showing the progression of eight nights, candles being lit one by one",
          "Add growing light overcoming darkness, miracle celebration vibes, and spiritual progression",
        ],
        colors: { primary: "#1e40af", secondary: "#fbbf24", accent: "#eff6ff" },
      },
      {
        id: "hanukkah-gifts",
        name: "Gift Giving",
        icon: "🎁",
        description: "Presents, family joy, generosity",
        prompts: [
          "Transform into a joyful Hanukkah gift exchange scene with wrapped presents in blue and silver, happy children",
          "Add gelt coins, family celebration atmosphere, and generous gift-giving tradition",
        ],
        colors: { primary: "#2563eb", secondary: "#c0c0c0", accent: "#fbbf24" },
      },
    ],
  },
  {
    id: "new-year",
    name: "New Year",
    icon: "🎆",
    comingSoon: true,
    presets: [],
  },
  {
    id: "valentines",
    name: "Valentine's",
    icon: "💝",
    comingSoon: true,
    presets: [],
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: "🎂",
    presets: [
      {
        id: "party-time",
        name: "Party Time",
        icon: "🎉",
        description: "Colorful balloons, confetti, celebration vibes",
        prompts: [
          "Transform into a vibrant birthday party scene with colorful balloons, confetti, streamers, and festive decorations",
          "Add celebration elements, party hats, and joyful birthday atmosphere",
        ],
        colors: { primary: "#FF1493", secondary: "#00BFFF", accent: "#FFD700" },
      },
      {
        id: "cake-celebration",
        name: "Cake Celebration",
        icon: "🎂",
        description: "Delicious cakes, candles, and sweet treats",
        prompts: [
          "Transform into a sweet birthday cake scene with layered frosting, lit candles, sprinkles, and dessert table",
          "Add bakery magic, pastel colors, and delicious birthday treats",
        ],
        colors: { primary: "#FFB6C1", secondary: "#DDA0DD", accent: "#FFFACD" },
      },
      {
        id: "golden-birthday",
        name: "Golden Birthday",
        icon: "✨",
        description: "Elegant gold, luxury milestone celebration",
        prompts: [
          "Transform into an elegant golden birthday scene with metallic gold decorations, champagne, and luxury elements",
          "Add sophisticated lighting, gold accents, and glamorous celebration atmosphere",
        ],
        colors: { primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF" },
      },
      {
        id: "kids-party",
        name: "Kids Party",
        icon: "🎈",
        description: "Playful fun, cartoon characters, games",
        prompts: [
          "Transform into a fun kids birthday party scene with bright colors, cartoon elements, toys, and playful decorations",
          "Add games, party favors, and energetic childhood celebration vibes",
        ],
        colors: { primary: "#FF6347", secondary: "#32CD32", accent: "#FF69B4" },
      },
      {
        id: "milestone-birthday",
        name: "Milestone Birthday",
        icon: "🎊",
        description: "Special ages, big celebrations, memories",
        prompts: [
          "Transform into a milestone birthday scene with number decorations, photo memories, and special celebration elements",
          "Add commemorative touches, achievement themes, and heartfelt celebration atmosphere",
        ],
        colors: { primary: "#4169E1", secondary: "#C0C0C0", accent: "#FFD700" },
      },
      {
        id: "surprise-party",
        name: "Surprise Party",
        icon: "🎁",
        description: "Exciting reveals, gift boxes, anticipation",
        prompts: [
          "Transform into a surprise party scene with wrapped presents, hidden decorations ready to reveal, and exciting atmosphere",
          "Add gift boxes, surprise elements, and dramatic party reveal lighting",
        ],
        colors: { primary: "#FF1493", secondary: "#8A2BE2", accent: "#FFD700" },
      },
    ],
  },
]

interface PresetSidebarProps {
  onSelectPreset: (preset: Preset) => void
  selectedPresetId?: string
}

export function PresetSidebar({ onSelectPreset, selectedPresetId }: PresetSidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string>("christmas")
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 px-2 ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <span className="text-xl">🎄</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block">Presets</span>
            <span className="text-xs text-slate-400">Choose a style</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="xl:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar ">
        {presetCategories.map((category) => (
          <div key={category.id} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.id ? "" : category.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${expandedCategory === category.id
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${category.comingSoon ? "opacity-60" : ""}`}
              disabled={category.comingSoon}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                {category.comingSoon && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Soon</span>
                )}
              </div>
              {!category.comingSoon && (
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${expandedCategory === category.id ? "rotate-90" : ""}`}
                />
              )}
            </button>

            {/* Presets */}
            {expandedCategory === category.id && !category.comingSoon && (
              <div className=" space-y-1 animate-in slide-in-from-top-2 duration-200">
                {category.presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset)
                      setIsMobileOpen(false)
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${selectedPresetId === preset.id
                      ? "bg-primary border border-white/20"
                      : "hover:bg-white/10"
                      }`}
                  >
                    <span className="text-lg mt-0.5">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{preset.name}</div>
                      <div className="text-xs text-slate-400 truncate">{preset.description}</div>
                      {/* Color Preview */}
                      <div className="flex gap-1 mt-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10 mt-4">
        <div className="text-xs text-slate-400 text-center">More occasions coming soon!</div>
      </div>
    </>
  )

  return (
    <div className="h-[100vh]">
      <button
        onClick={() => setIsMobileOpen(true)}
        className="xl:hidden fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform"
      >
        🎄
      </button>

      {isMobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] glass-card border-l border-white/10 flex flex-col py-6 px-4  backdrop-blur-xl animate-in slide-in-from-right duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden xl:flex w-72 h-full glass-card border-l border-white/10 flex-col py-6 px-4 relative z-20 ">
        {sidebarContent}
      </aside>
    </div>
  )
}

export type { Preset }
