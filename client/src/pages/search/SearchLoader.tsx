import {
  SearchQuery,
  SearchQueryVariables,
  useSearchQuery,
} from "../../schemas/Search.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../QueryClient";

const searchQuery = (id: SearchQueryVariables) => ({
  queryKey: useSearchQuery.getKey(id),
  queryFn: useSearchQuery.fetcher(id),
});
export const searchLoader = async ({ params }: LoaderFunctionArgs) => {
  const searchTerm = decodeURIComponent(params["searchTerm"] || "");
  return queryClient.ensureQueryData<SearchQuery>(
    searchQuery({
      searchTerm: searchTerm || "",
    })
  );
};
