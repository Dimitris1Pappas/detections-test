import { useEffect, useState } from "react";

function getDetectionId(): string | null {
  return new URLSearchParams(window.location.search)
    .get("detection");
}

export function useDetectionNavigation() {
  const [detectionId, setDetectionId] =
    useState<string | null>(getDetectionId);

  useEffect(() => {
    const handlePopState = () => {
      setDetectionId(getDetectionId());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function openDetection(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("detection", id);

    window.history.pushState({}, "", url);
    setDetectionId(id);
  }

  function closeDetection() {
    const url = new URL(window.location.href);
    url.searchParams.delete("detection");

    window.history.pushState({}, "", url);
    setDetectionId(null);
  }

  return {
    detectionId,
    openDetection,
    closeDetection,
  };
}