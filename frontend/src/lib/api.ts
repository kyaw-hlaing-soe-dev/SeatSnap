import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getCorrelationId } from "./utils";

type ApiError = {
  error: string;
  message: string;
  ref?: string;
};

type ValidationErrors = Record<string, string>;

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers = config.headers ?? {};
    config.headers["X-Correlation-ID"] = getCorrelationId();
  }
  config.headers = config.headers ?? {};
  config.headers["Content-Type"] = "application/json";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    if (typeof window !== "undefined") {
      if (status === 429) {
        toast.warning("Too many requests, slow down");
      }
      if (status === 409) {
        toast.error("Slot no longer available");
      }
    }

    if (status === 422) {
      const message = error.response?.data?.message;
      if (typeof message === "string") {
        const fieldErrors: ValidationErrors = {};
        message.split(";").forEach((chunk) => {
          const [field, ...rest] = chunk.split(":");
          if (rest.length > 0) {
            fieldErrors[field.trim()] = rest.join(":").trim();
          }
        });
        (error as AxiosError & { validationErrors?: ValidationErrors }).validationErrors = fieldErrors;
      }
    }

    return Promise.reject(error);
  }
);
