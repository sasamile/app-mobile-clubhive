import {
  setApiEnvironment,
  type ApiEnvironment,
} from "@/lib/api-env";
import { clearUserLocalCache } from "@/lib/local-cache";
import { clearAuthData } from "@/lib/storage";

export async function switchApiEnvironment(
  env: ApiEnvironment
): Promise<void> {
  await setApiEnvironment(env);
  await clearAuthData();
  await clearUserLocalCache();
}
