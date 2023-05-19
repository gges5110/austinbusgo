import { useQueryClient } from "@tanstack/react-query";

export const useNearByStops = () => {
  const queryClient = useQueryClient();

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
