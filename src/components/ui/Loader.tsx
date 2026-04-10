"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLogo?: boolean;
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
      container: "w-20 h-20",
      titleClass: "text-sm/tight font-medium",
      subtitleClass: "text-xs/relaxed",
      spacing: "space-y-2",
      maxWidth: "max-w-48",
      logoSize: "w-8 h-8",
    },
    md: {
      container: "w-32 h-32",
      titleClass: "text-base/snug font-medium",
      subtitleClass: "text-sm/relaxed",
      spacing: "space-y-3",
      maxWidth: "max-w-56",
      logoSize: "w-12 h-12",
    },
    lg: {
      container: "w-56 h-56",
      titleClass: "text-xl font-bold",
      subtitleClass: "text-base/relaxed",
      spacing: "space-y-4",
      maxWidth: "max-w-xs",
      logoSize: "w-20 h-20",
    },
    xl: {
      container: "w-72 h-72",
      titleClass: "text-2xl font-bold",
      subtitleClass: "text-lg/relaxed",
      spacing: "space-y-6",
      maxWidth: "max-w-sm",
      logoSize: "w-28 h-28",
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
      {/* Enhanced Monochrome Loader */}
      <motion.div
        className={cn(
          "relative isolate [filter:drop-shadow(0_0_20px_rgba(13,148,136,0.22))] dark:[filter:none]",
          config.container,
        )}
        animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.02, 1] }}
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
        {/* Outer ring — deep teal read on white (avoid low-contrast gray rings) */}
        <motion.div
          className="absolute inset-0 rounded-full dark:hidden"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgb(15, 118, 110) 95deg, rgb(13, 148, 136) 155deg, transparent 255deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 30%, black 34%, black 46%, transparent 50%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 30%, black 34%, black 46%, transparent 50%)`,
            opacity: 1,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />

        {/* Primary ring — bright teal arc */}
        <motion.div
          className="absolute inset-0 rounded-full dark:hidden"
          style={{
            background: `conic-gradient(from 40deg, transparent 0deg, rgb(20, 184, 166) 110deg, rgb(13, 148, 136) 200deg, rgba(13, 148, 136, 0.25) 280deg, transparent 360deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 38%, black 41%, black 49%, transparent 52%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 38%, black 41%, black 49%, transparent 52%)`,
            opacity: 1,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }
          }
        />

        {/* Secondary ring — counter rotation, slate for depth */}
        <motion.div
          className="absolute inset-0 rounded-full dark:hidden"
          style={{
            background: `conic-gradient(from 180deg, transparent 0deg, rgb(71, 85, 105) 70deg, rgb(100, 116, 139) 130deg, transparent 220deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 50%, black 53%, black 58%, transparent 62%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 50%, black 53%, black 58%, transparent 62%)`,
            opacity: 0.72,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, -360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }
          }
        />

        {/* Accent — thin outer glint */}
        <motion.div
          className="absolute inset-0 rounded-full dark:hidden"
          style={{
            background: `conic-gradient(from 270deg, transparent 0deg, rgb(45, 212, 191) 55deg, transparent 100deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 56%, black 58%, black 62%, transparent 66%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 56%, black 58%, black 62%, transparent 66%)`,
            opacity: 0.85,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />

        {/* Dark mode variants */}
        <motion.div
          className="absolute inset-0 rounded-full dark:block hidden"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 255, 255) 90deg, transparent 180deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
            opacity: 0.8,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />

        <motion.div
          className="absolute inset-0 rounded-full dark:block hidden"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 255, 255) 120deg, rgba(255, 255, 255, 0.5) 240deg, transparent 360deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
            opacity: 0.9,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }
          }
        />

        <motion.div
          className="absolute inset-0 rounded-full dark:block hidden"
          style={{
            background: `conic-gradient(from 180deg, transparent 0deg, rgba(255, 255, 255, 0.6) 45deg, transparent 90deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
            opacity: 0.35,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, -360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }
          }
        />

        <motion.div
          className="absolute inset-0 rounded-full dark:block hidden"
          style={{
            background: `conic-gradient(from 270deg, transparent 0deg, rgba(255, 255, 255, 0.4) 20deg, transparent 40deg)`,
            mask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
            WebkitMask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
            opacity: 0.5,
          }}
          animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />

        {/* Centered Logo */}
        {showLogo && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              className={cn(
                "relative flex items-center justify-center p-4",
                config.logoSize,
              )}
            >
              <img
                src="/bluprnt_logo.svg"
                alt="BLUPRNT"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Typography with Breathing Animation */}
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
        {/* Clean title with subtle animation */}
        <motion.h1
          className={cn(
            config.titleClass,
            "text-slate-900 font-bold tracking-tight leading-[1.15] antialiased",
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

        {/* Clean subtitle with subtle animation */}
        {subtitle && (
          <motion.p
            className={cn(
              config.subtitleClass,
              "text-slate-400 font-medium tracking-tight leading-[1.45] antialiased",
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
        )}
      </motion.div>
    </div>
  );
}
