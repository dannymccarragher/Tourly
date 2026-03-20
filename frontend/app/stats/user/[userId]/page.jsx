"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UserProfileRedirect() {
  const router = useRouter();
  const { userId } = useParams();
  useEffect(() => {
    if (userId) router.replace(`/profile/${userId}`);
  }, [router, userId]);
  return null;
}
