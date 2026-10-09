import { DomainError } from "@/domain/errors";
import { willowAppSecret } from "@/domain/secrets";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { listPublicChangelog, listPublicRequests, listUserNotifications } from "@/server/requests";

export async function getDemoCatalog() {
  const empty = {
    requests: [],
    notifications: [],
    unreadCount: 0,
    changelog: [],
  };
  try {
    const secret = willowAppSecret();
    const [requests, notifications, changelog] = await Promise.all([
      listPublicRequests({ appSecret: secret, externalUserId: WILLOW_DEMO_USER.externalUserId }),
      listUserNotifications({ appSecret: secret, externalUserId: WILLOW_DEMO_USER.externalUserId }),
      listPublicChangelog({ appSecret: secret }),
    ]);
    return {
      requests,
      notifications: notifications.notifications,
      unreadCount: notifications.unreadCount,
      changelog,
    };
  } catch (error) {
    if (error instanceof DomainError && error.code === "not_found") return empty;
    throw error;
  }
}

export type DemoCatalog = Awaited<ReturnType<typeof getDemoCatalog>>;
