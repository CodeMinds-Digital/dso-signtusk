import type { DataTransformer } from "@trpc/server";
import SuperJSON from "superjson";

// Register Prisma Decimal transformer for SuperJSON
SuperJSON.registerCustom<any, string>(
  {
    isApplicable: (v): v is any => {
      return (
        v &&
        typeof v === "object" &&
        v.constructor &&
        v.constructor.name === "Decimal"
      );
    },
    serialize: (v) => v.toString(),
    deserialize: (v) => parseFloat(v),
  },
  "decimal"
);

export const dataTransformer: DataTransformer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize: (data: any) => {
    if (data instanceof FormData) {
      return data;
    }

    return SuperJSON.serialize(data);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deserialize: (data: any) => {
    return SuperJSON.deserialize(data);
  },
};
