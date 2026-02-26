import { useSearchParams } from "react-router-dom";

export const useShowAllVehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showAllVehicles = searchParams.get("buses") === "1";

  const setShowAllVehicles = (value: boolean) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set("buses", "1");
        } else {
          next.delete("buses");
        }
        return next;
      },
      { replace: true }
    );
  };

  return [showAllVehicles, setShowAllVehicles] as const;
};
