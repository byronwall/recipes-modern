"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "~/components/ui/carousel";
import { cn } from "~/lib/utils";

export type LightboxImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
};

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  initialIndex?: number;
  className?: string;
};

export function ImageLightbox(props: ImageLightboxProps) {
  const { open, onOpenChange, images, initialIndex = 0, className } = props;
  const [api, setApi] = useState<CarouselApi | null>(null);

  // Ensure index is in range
  const safeIndex = useMemo(() => {
    if (!images.length) return 0;
    return Math.max(0, Math.min(initialIndex, images.length - 1));
  }, [images.length, initialIndex]);

  // Sync to initial index on open
  useEffect(() => {
    if (open && api && images.length) {
      api.scrollTo(safeIndex, true);
    }
  }, [open, api, safeIndex, images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [open, onOpenChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className={cn(
          "fixed inset-0 z-50 grid h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 border-0 bg-black/70 p-0 sm:rounded-none",
          className,
        )}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <Carousel
            className="mx-auto w-full max-w-[90dvw]"
            opts={{
              loop: images.length > 1,
              dragFree: false,
              align: "center",
            }}
            setApi={setApi}
          >
            <CarouselContent>
              {images.map((img, idx) => (
                <CarouselItem
                  key={idx}
                  className="flex items-center justify-center"
                >
                  <figure className="relative flex max-h-[85dvh] w-full items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt ?? ""}
                      className="max-h-[85dvh] max-w-full select-none rounded-md object-contain"
                      draggable={false}
                    />
                    {img.caption ? (
                      <figcaption className="pointer-events-none absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2 truncate text-center text-sm text-white/80">
                        {img.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>

            {images.length > 1 ? (
              <>
                <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 border-0 bg-black/50 text-white hover:bg-black/70" />
                <CarouselNext className="right-4 top-1/2 -translate-y-1/2 border-0 bg-black/50 text-white hover:bg-black/70" />
              </>
            ) : null}
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageLightbox;
