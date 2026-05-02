import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Clinic } from "../types";

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const response = await api.get<Clinic[]>("/clinics");
      return response.data;
    },
    staleTime: 30_000
  });
}
