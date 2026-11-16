import { queryOptions } from "@tanstack/react-query";
import { getDirectory } from "./friends.functions";

export const directoryQuery = queryOptions({
  queryKey: ["friend-directory"], queryFn: () => getDirectory(),
  staleTime: 0, refetchInterval: 15000, refetchOnWindowFocus: "always",
});