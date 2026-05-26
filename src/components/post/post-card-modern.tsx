"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Globe,
  CreditCard,
  Loader2,
  LockOpen,
} from "lucide-react";
import { cn } from "~/lib/utils";
import MediaGallery from "./media-gallary-modern";
import QRCode from "react-qr-code";
import type { Media, PostGroup } from "@prisma/client";
import { api } from "~/utils/api";
import CustomAvatar from "../common/custom-avatar";
import { useShareModalStore } from "../store/share-modal-store";
import { CommentSection } from "./comment/post-comment-section";
import { Preview } from "../common/quill-preview";
import { PostContextMenu } from "../common/post-context-menu";
import Link from "next/link";

interface PostCardProps {
  post: PostGroup & {
    medias: Media[];
    subscription?: {
      id: number;
      name: string;
      price: number;
    } | null;
    creator: {
      id: string;
      name: string;
      profileUrl: string | null;
      pageAsset?: { code: string; issuer: string } | null;
      customPageAssetCodeIssuer?: string | null;
    };
  };
  creator: {
    id: string;
    name: string;
    profileUrl: string | null;
    pageAsset?: { code: string; issuer: string } | null;
    customPageAssetCodeIssuer?: string | null;
  };
  likeCount: number;
  commentCount: number;
  locked: boolean;
  show: boolean;
  media: Media[];
  unCollectedPostId?: number | null;
}

export default function PostCardModern({
  post,
  creator,
  likeCount,
  commentCount,
  locked,
  show,
  media,
  unCollectedPostId,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);

  const postUrl = `/posts/${post.id}`;
  const fullPostUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${postUrl}`
      : postUrl;

  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);
  const { setIsOpen: setShareModalOpen, setData } = useShareModalStore();

  const deleteLike = api.fan.post.unLike.useMutation();
  const likeMutation = api.fan.post.likeApost.useMutation();

  const toggleLike = () => {
    if (liked) deleteLike.mutate(post.id);
    else likeMutation.mutate(post.id);
  };

  const hasLotsOfMedia = media && media.length > 3;
  const displayMedia = showAllMedia ? media : media?.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-none border-x-0 border-b border-t-0 border-zinc-200 bg-white shadow-none transition-colors dark:border-zinc-800 dark:bg-zinc-950",
        deletePostId === post.id && "animate-pulse border-red-300",
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex w-full items-start gap-3">
            <Link href={`/${creator.id}`}>
              <CustomAvatar
                url={creator.profileUrl}
                className="h-11 w-11 border border-zinc-200 dark:border-zinc-700"
              />
            </Link>
            <div className="flex w-full justify-between gap-2 pt-0.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 leading-none">
                  <Link href={`/${creator.id}`}>
                    <span className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {creator.name}
                    </span>
                  </Link>
                  <Badge
                    variant={locked ? "outline" : "secondary"}
                    className={cn("h-5 rounded px-1 text-[11px]")}
                  >
                    {locked ? (
                      show ? (
                        <LockOpen className="mr-1 h-3 w-3" />
                      ) : (
                        <Lock className="mr-1 h-3 w-3" />
                      )
                    ) : (
                      <Globe className="mr-1 h-3 w-3" />
                    )}
                    {locked ? (show ? "Unlocked" : "Locked") : "Public"}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  {formatDate(post.createdAt.toString())}
                </p>
              </div>
              {post.medias && post.medias.length > 0 && (
                <button
                  onClick={() => setShowFullscreenQR(true)}
                  className="flex cursor-pointer flex-col items-center gap-1 transition-opacity hover:opacity-80"
                  aria-label="View QR code fullscreen"
                >
                  <QRCode
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/action/qr?postId=${unCollectedPostId}`}
                    size={60}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    className="rounded-sm border-2 border-white"
                  />
                  <span className="text-center text-[11px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                    Scan to Collect
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {show ? (
          <>
            <div className="mb-3">
              <Preview value={post.content} />
            </div>

            {displayMedia && displayMedia.length > 0 && (
              <div className="mb-3">
                <MediaGallery media={displayMedia} />
                {hasLotsOfMedia && (
                  <Button
                    variant="ghost"
                    className="mt-2 h-8 w-full text-xs"
                    onClick={() => setShowAllMedia(!showAllMedia)}
                  >
                    {showAllMedia
                      ? "Show less"
                      : `Show all ${media?.length} media`}
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="relative mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 p-8 dark:from-zinc-800 dark:to-zinc-900">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="mb-4 rounded-full bg-zinc-300/50 p-4 dark:bg-zinc-700/50">
                <Lock className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                This content is locked
              </h3>
              <p className="mb-4 max-w-xs text-center text-sm text-zinc-500 dark:text-zinc-400">
                Subscribe to {creator.name} to unlock this and other exclusive
                posts
              </p>
              {post.subscription && (
                <Button size="sm" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscribe for {post.subscription.price} credits
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5 px-2", liked && "text-red-500")}
            onClick={toggleLike}
          >
            {liked ? (
              <Heart className="h-4 w-4 fill-current" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
            onClick={() => {
              setData(fullPostUrl);
              setShareModalOpen(true);
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4">
            <CommentSection postId={post.id} initialCommentCount={commentCount} />
          </div>
        )}
      </CardContent>

      {showFullscreenQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowFullscreenQR(false)}
        >
          <div className="rounded-2xl bg-white p-8">
            <QRCode
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/action/qr?postId=${unCollectedPostId}`}
              size={300}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
            <p className="mt-4 text-center text-sm text-zinc-600">
              Scan to collect this post
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
