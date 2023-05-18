import { queryClient } from "../../QueryClient";

export const useNearByStops = () => {
  const fetchNearByStops = () => {
    queryClient.removeQueries({
      queryKey: ["NearByStops"],
    });
  };

  const isLoading =
    queryClient.isFetching({
      queryKey: ["NearByStops"],
    }) !== 0;

  return {
    fetchNearByStops,
    isLoading,
  };
};
