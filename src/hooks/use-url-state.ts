"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UrlParamValue = string | readonly string[] | null | undefined;
type UrlParamPatch = Record<string, UrlParamValue>;

export type UrlStateCodec<T> = {
  defaultValue: T;
  parse: (value: string | null) => T;
  serialize: (value: T) => string | null | undefined;
};

export function useReplaceUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (patch: UrlParamPatch) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        nextParams.delete(key);

        if (value === null || value === undefined) continue;

        if (typeof value !== "string") {
          for (const entry of value) {
            if (entry) nextParams.append(key, entry);
          }
          continue;
        }

        if (value) nextParams.set(key, value);
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
}

export function useUrlState<T>(
  key: string,
  codec: UrlStateCodec<T>,
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const replaceUrlParams = useReplaceUrlParams();

  const value = useMemo(
    () => codec.parse(searchParams.get(key)),
    [codec, key, searchParams],
  );

  const setValue = useCallback(
    (nextValue: T) => {
      replaceUrlParams({ [key]: codec.serialize(nextValue) });
    },
    [codec, key, replaceUrlParams],
  );

  return [value, setValue];
}

export const urlStateCodecs = {
  string(defaultValue = ""): UrlStateCodec<string> {
    return {
      defaultValue,
      parse: (value) => value ?? defaultValue,
      serialize: (value) => {
        return value === defaultValue || value === "" ? null : value;
      },
    };
  },

  number(
    defaultValue: number,
    options?: { allowedValues?: readonly number[] },
  ) {
    return {
      defaultValue,
      parse: (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return defaultValue;
        if (options?.allowedValues && !options.allowedValues.includes(parsed)) {
          return defaultValue;
        }
        return parsed;
      },
      serialize: (value) => (value === defaultValue ? null : String(value)),
    } satisfies UrlStateCodec<number>;
  },

  boolean(defaultValue: boolean): UrlStateCodec<boolean> {
    return {
      defaultValue,
      parse: (value) => {
        if (value === "1" || value === "true") return true;
        if (value === "0" || value === "false") return false;
        return defaultValue;
      },
      serialize: (value) => (value === defaultValue ? null : value ? "1" : "0"),
    };
  },

  enum<const T extends string>(
    values: readonly T[],
    defaultValue: T,
  ): UrlStateCodec<T> {
    return {
      defaultValue,
      parse: (value) =>
        value && values.includes(value as T) ? (value as T) : defaultValue,
      serialize: (value) => (value === defaultValue ? null : value),
    };
  },

  optionalEnum<const T extends string>(
    values: readonly T[],
  ): UrlStateCodec<T | undefined> {
    return {
      defaultValue: undefined,
      parse: (value) =>
        value && values.includes(value as T) ? (value as T) : undefined,
      serialize: (value) => value ?? null,
    };
  },

  csv(defaultValue: string[] = []): UrlStateCodec<string[]> {
    return {
      defaultValue,
      parse: (value) => {
        if (!value) return defaultValue;
        return value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
      },
      serialize: (value) => (value.length > 0 ? value.join(",") : null),
    };
  },
};
