"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { actionMarkNavSeen } from "@/app/actions";
import type { NavChannel } from "@/lib/notifications";

export function MarkNavSeen({ channel }: { channel: NavChannel }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void actionMarkNavSeen(channel).then(() => router.refresh());
  }, [channel, router]);

  return null;
}
