// src/lib/api.ts
import { server as baseServer } from "~/action/serverAction";
import { withReactQueryHooks } from "~/lib/withReactQueryHooks";

export const api = withReactQueryHooks(baseServer);
