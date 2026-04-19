"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import BountyList from "~/components/bounty/bounty-list";
import BountyListModern from "~/components/bounty/bounty-list-modern";
import BountySkeleton from "~/components/bounty/bounty-skeleton";
import BountySkeletonModern from "~/components/bounty/bounty-skeleton-modern";
import SearchAndSort from "~/components/bounty/search-and-sort";
import SearchAndSortModern from "~/components/bounty/search-and-sort-modern";
import { Button } from "~/components/shadcn/ui/button";
import { checkStellarAccountActivity } from "~/lib/helper/helper_client";
import { sortOptionEnum } from "~/types/bounty/bounty-type";
import { api } from "~/utils/api";
import { getCookie } from "cookies-next";

export enum filterEnum {
  ALL = "ALL",
  NOT_JOINED = "NOT_JOINED",
  JOINED = "JOINED",
}

export enum BountyTypeFilter {
  ALL = "ALL",
  GENERAL = "GENERAL",
  LOCATION_BASED = "LOCATION_BASED",
  SCAVENGER_HUNT = "SCAVENGER_HUNT",
}

const LAYOUT_MODE_COOKIE = "beam-layout-mode";

const Bounty = () => {
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(
    sortOptionEnum.DATE_DESC,
  );
  const [filter, setFilter] = useState<filterEnum>(filterEnum.ALL);
  const [typeFilter, setTypeFilter] = useState<BountyTypeFilter>(
    BountyTypeFilter.ALL,
  );
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isActiveStatusLoading, setIsActiveStatusLoading] =
    useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("modern");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const storedMode = getCookie(LAYOUT_MODE_COOKIE);
    if (storedMode === "legacy" || storedMode === "modern") {
      setLayoutMode(storedMode);
    }
  }, []);

  const getAllBounty = api.bounty.Bounty.getAllBounties.useInfiniteQuery(
    {
      limit: 10,
      search: debouncedSearchTerm,
      sortBy: sortOption,
      filter: filter,
      bountyType: typeFilter !== BountyTypeFilter.ALL ? typeFilter : undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  useEffect(() => {
    const checkAccountActivity = async () => {
      if (session.data?.user.id) {
        setIsActiveStatusLoading(true);
        const active = await checkStellarAccountActivity(session.data.user.id);
        setIsActive(active);
        setIsActiveStatusLoading(false);
      }
    };
    checkAccountActivity();
  }, [session.data?.user.id]);

  if (layoutMode === "modern") {
    return (
      <div className="relative flex h-[calc(100vh-10.8vh)] w-full flex-col gap-4 overflow-y-auto px-3 scrollbar-hide md:mx-auto md:w-[85vw] md:px-0">
        <div>
          <SearchAndSortModern
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            filter={filter}
            setFilter={setFilter}
          />
        </div>

        <div className="my-4 flex h-[calc(100vh-20vh)] flex-col gap-4">
          <div className="">
            {getAllBounty.isLoading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 5 }, (_, index: number) => (
                  <BountySkeletonModern key={index} />
                ))}
              </div>
            )}
            {getAllBounty.data?.pages.flatMap((page) => page.bounties).length >
            0 ? (
              <BountyListModern
                isActive={isActive}
                isActiveStatusLoading={isActiveStatusLoading}
                bounties={
                  getAllBounty.data?.pages.flatMap((page) => page.bounties) ??
                  []
                }
              />
            ) : null}
          </div>
          {getAllBounty.hasNextPage && (
            <Button
              className="flex w-1/2 items-center justify-center shadow-sm shadow-black md:w-1/4"
              onClick={() => void getAllBounty.fetchNextPage()}
              disabled={getAllBounty.isFetchingNextPage}
            >
              {getAllBounty.isFetchingNextPage
                ? "Loading more..."
                : "Load More"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col">
      {/* Fixed header with search and filters */}
      <div className="sticky top-0 z-10  bg-background/80 pb-4 backdrop-blur-sm">
        <SearchAndSort
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
          filter={filter}
          setFilter={setFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        {/* Loading state */}
        {getAllBounty.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }, (_, index: number) => (
              <BountySkeleton key={index} />
            ))}
          </div>
        )}

        {/* Bounty list */}
        <div className="mb-6">
          {getAllBounty.data?.pages.map((page) => (
            <BountyList
              isActive={isActive}
              isActiveStatusLoading={isActiveStatusLoading}
              key={page.nextCursor}
              bounties={page.bounties}
            />
          ))}
        </div>

        {/* Load more button - centered at the bottom */}
        {getAllBounty.hasNextPage && (
          <div className="flex justify-center pb-8">
            <Button
              className="w-full max-w-md"
              onClick={() => void getAllBounty.fetchNextPage()}
              disabled={getAllBounty.isFetchingNextPage}
            >
              {getAllBounty.isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading more...
                </div>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!getAllBounty.isLoading &&
          getAllBounty.data?.pages[0]?.bounties.length === 0 && (
            <div className="flex h-40 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No bounties found</p>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default Bounty;
