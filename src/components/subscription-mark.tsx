"use client";

import { useState } from "react";
import { FinanceIcon } from "./ui/icon-picker";

export function subscriptionLogoUrl(id: string, revision?: string | null) {
  return revision ? "/api/subscription-logo?" + new URLSearchParams({ id, revision }) : "";
}

export function SubscriptionMark({ icon, src }: { icon: string; src?: string }) {
  const [failed, setFailed] = useState("");
  return (
    <span className="subscription-mark" aria-hidden="true">
      {src && failed !== src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={34} height={34} onError={() => setFailed(src)} />
      ) : <FinanceIcon name={icon} />}
    </span>
  );
}
