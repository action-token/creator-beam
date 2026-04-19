"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";
import type { sortOptionEnum } from "~/types/bounty/bounty-type";
import type { filterEnum } from "~/pages/bounties/bounties-modern";
import { Tabs, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import { cn } from "~/lib/utils";

export default function SearchAndSort({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  filter,
  setFilter,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortOption: string;
  setSortOption: (value: sortOptionEnum) => void;
  filter: string;
  setFilter?: (value: filterEnum) => void;
}) {
  return (
    <div className="pt-2">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="hidden text-2xl font-bold md:block">
            Discover Bounties
          </h1>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-grow">
            <Input
              type="search"
              placeholder="Search bounties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Select
            value={sortOption}
            onValueChange={(value: sortOptionEnum) => setSortOption(value)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DATE_DESC">Newest First</SelectItem>
              <SelectItem value="DATE_ASC">Oldest First</SelectItem>
              <SelectItem value="PRICE_DESC">Highest Prize</SelectItem>
              <SelectItem value="PRICE_ASC">Lowest Prize</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          {setFilter && (
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as filterEnum)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 bg-[#f3f1ee] dark:bg-zinc-800">
                <TabsTrigger
                  value="ALL"
                  className="text-black data-[state=active]:bg-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:data-[state=active]:bg-zinc-700"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="NOT_JOINED"
                  className="text-black data-[state=active]:bg-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:data-[state=active]:bg-zinc-700"
                >
                  Not Joined
                </TabsTrigger>
                <TabsTrigger
                  value="JOINED"
                  className="text-black data-[state=active]:bg-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:data-[state=active]:bg-zinc-700"
                >
                  Joined
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
