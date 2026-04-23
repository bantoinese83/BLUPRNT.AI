"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLogo?: boolean;
}

const SNU_PATH =
  "m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64";

function SnurraSpinner({
  sizePx,
  showLogo,
  logoSizeClass,
  reduceMotion,
}: {
  sizePx: number;
  showLogo: boolean;
  logoSizeClass: string;
  reduceMotion: boolean;
}) {
  const safeId = useId().replace(/:/g, "");
  const filterId = `bluprnt-snurra-f-${safeId}`;
  const gradMainId = `bluprnt-snurra-g-${safeId}`;
  const gradShadowId = `bluprnt-snurra-gs-${safeId}`;

  const shadowBlur = Math.max(2, Math.round(sizePx * 0.025));
  const shadowOffset = Math.max(1, Math.round(sizePx * 0.015));

  const pathMotionClass = cn(
    "bluprnt-snurra-halvan bluprnt-snurra-halvan-path",
    reduceMotion && "[animation:none]",
  );
  const circleMotionClass = cn(
    "bluprnt-snurra-strecken bluprnt-snurra-strecken-path",
    reduceMotion && "[animation:none]",
  );

  const gradientStops = (
    <>
      <stop offset="0" className="bluprnt-snurra-stop-a" />
      <stop offset="1" className="bluprnt-snurra-stop-b" />
    </>
  );

  return (
    <div className="relative isolate" style={{ width: sizePx, height: sizePx }}>
      <svg
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"
              result="inreGegga"
            />
            <feComposite in="SourceGraphic" in2="inreGegga" operator="atop" />
          </filter>
        </defs>
      </svg>

      <svg
        className="absolute inset-0"
        viewBox="0 0 200 200"
        width={sizePx}
        height={sizePx}
        style={{
          opacity: 0.28,
          filter: `blur(${shadowBlur}px)`,
          transform: `translate(${shadowOffset}px, ${shadowOffset}px)`,
        }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradShadowId}
            x1="40"
            y1="40"
            x2="160"
            y2="160"
            gradientUnits="userSpaceOnUse"
          >
            {gradientStops}
          </linearGradient>
        </defs>
        <path
          className={pathMotionClass}
          style={{ stroke: `url(#${gradShadowId})` }}
          d={SNU_PATH}
        />
        <circle
          className={circleMotionClass}
          style={{ stroke: `url(#${gradShadowId})` }}
          cx="100"
          cy="100"
          r="64"
        />
      </svg>

      <svg
        className="relative z-[1] size-full"
        viewBox="0 0 200 200"
        width={sizePx}
        height={sizePx}
        style={{ filter: `url(#${filterId})` }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradMainId}
            x1="40"
            y1="40"
            x2="160"
            y2="160"
            gradientUnits="userSpaceOnUse"
          >
            {gradientStops}
          </linearGradient>
        </defs>
        <path
          className={pathMotionClass}
          style={{ stroke: `url(#${gradMainId})` }}
          d={SNU_PATH}
        />
        <circle
          className={circleMotionClass}
          style={{ stroke: `url(#${gradMainId})` }}
          cx="100"
          cy="100"
          r="64"
        />
      </svg>

      {showLogo ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className={cn(
              "relative flex items-center justify-center p-2",
              logoSizeClass,
            )}
          >
            <img
              src="/bluprnt_logo.webp"
              alt="BLUPRNT"
              className="h-full w-full object-contain"
            />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export function Loader({
  title = "Configuring your account...",
  subtitle = "Please wait while we prepare everything for you",
  size = "md",
  showLogo = false,
  className,
  ...props
}: LoaderProps) {
  const reduceMotion = useReducedMotion();

  const sizeConfig = {
    sm: {
      sizePx: 80,
      titleClass: "text-sm/tight font-medium",
      subtitleClass: "text-xs/relaxed",
      spacing: "space-y-2",
      maxWidth: "max-w-48",
      logoSize: "h-10 w-10",
    },
    md: {
      sizePx: 128,
      titleClass: "text-base/snug font-medium",
      subtitleClass: "text-sm/relaxed",
      spacing: "space-y-3",
      maxWidth: "max-w-56",
      logoSize: "h-16 w-16",
    },
    lg: {
      sizePx: 224,
      titleClass: "text-xl font-bold",
      subtitleClass: "text-base/relaxed",
      spacing: "space-y-4",
      maxWidth: "max-w-xs",
      logoSize: "h-24 w-24",
    },
    xl: {
      sizePx: 288,
      titleClass: "text-2xl font-bold",
      subtitleClass: "text-lg/relaxed",
      spacing: "space-y-6",
      maxWidth: "max-w-sm",
      logoSize: "h-32 w-32",
    },
  };

  const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.md;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-8 p-8",
        className,
      )}
      {...props}
    >
      <SnurraSpinner
        sizePx={config.sizePx}
        showLogo={showLogo}
        logoSizeClass={config.logoSize}
        reduceMotion={!!reduceMotion}
      />

      <motion.div
        className={cn("text-center", config.spacing, config.maxWidth)}
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.4,
          duration: 1,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <motion.h1
          className={cn(
            config.titleClass,
            "font-bold leading-[1.15] tracking-tight text-slate-900 antialiased",
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.6,
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <motion.span
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: [0.95, 0.8, 0.95] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 3,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                  }
            }
          >
            {title}
          </motion.span>
        </motion.h1>

        {subtitle ? (
          <motion.p
            className={cn(
              config.subtitleClass,
              "font-medium leading-[1.45] tracking-tight text-slate-400 antialiased",
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.8,
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <motion.span
              animate={
                reduceMotion ? { opacity: 1 } : { opacity: [0.6, 0.4, 0.6] }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 4,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                    }
              }
            >
              {subtitle}
            </motion.span>
          </motion.p>
        ) : null}
      </motion.div>
    </div>
  );
}
