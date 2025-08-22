"use client";

import React from 'react';

interface LoaderProps {
  fullscreen?: boolean;
  message?: string;
}

export default function Loader({ fullscreen = false, message }: LoaderProps) {
  return (
    <div
      className={`${fullscreen ? 'min-h-screen' : 'h-full'} w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100`}
      role="status"
      aria-live="polite"
    >
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-primary/30 to-orange-300/40 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-orange-200/50 to-primary/30 blur-3xl animate-pulse [animation-delay:400ms]" />
      </div>

      <div className="relative flex flex-col items-center space-y-10 px-6">
        <div className="relative flex items-center justify-center">
          {/* Outer rotating ring / plate */}
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-orange-400 to-primary animate-spin-slow shadow-3xl p-[6px]">
              <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center border border-orange-200/60">
                <span className="text-4xl font-extrabold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent tracking-tight select-none">
                  FF
                </span>
              </div>
            </div>

            {/* Orbiting dots (ingredients) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1" />
              <div className="absolute top-1/2 left-1/2 -ml-1 -mt-1 w-3 h-3 rounded-full bg-gradient-to-br from-primary to-orange-400 shadow animate-orbit" />
              <div className="absolute top-1/2 left-1/2 -ml-1 -mt-1 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-primary shadow animate-orbit-delay2" />
              <div className="absolute top-1/2 left-1/2 -ml-1 -mt-1 w-4 h-4 rounded-full bg-white shadow ring-2 ring-orange-300/60 animate-orbit-delay3" />
            </div>
          </div>
        </div>

        <div className="text-center relative">
          <h2 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-orange-500 to-primary bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]">
              FoodFusion
            </span>
          </h2>
          <p className="mt-4 text-gray-600 font-medium flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse [animation-delay:150ms]" />
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
            </span>
            {message || 'Preparing something tasty for you'}
          </p>

          {/* Shimmer bars */}
          <div className="mt-8 flex flex-col items-center space-y-3">
            <div className="h-3 w-64 rounded-full shimmer" />
            <div className="h-3 w-56 rounded-full shimmer [animation-delay:200ms]" />
            <div className="h-3 w-44 rounded-full shimmer [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
