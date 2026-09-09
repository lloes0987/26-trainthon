"use client";

import ShareLinkBar from "@/components/ShareLinkBar";

interface ShareButtonProps {
  url: string;
  title: string;
  sharePath: string;
}

export default function ShareButton({ url, title, sharePath }: ShareButtonProps) {
  return (
    <ShareLinkBar url={url} title={title} sharePath={sharePath} />
  );
}
