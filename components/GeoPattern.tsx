"use client";

import { useId } from "react";

/** زخرفة هندسية إسلامية — نجمة ثمانية متكررة، ترسم ولا تُحمَّل من الخارج */
export default function GeoPattern({
  className = "",
  opacity = 0.06,
}: {
  className?: string;
  opacity?: number;
}) {
  // معرّف فريد لكل نسخة — تكرار id واحد في الصفحة يجعل كل المراجع
  // تشير إلى أول نمط فقط
  const id = useId();

  return (
    <svg
      className={className}
      aria-hidden="true"
      style={{ opacity }}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} width="96" height="96" patternUnits="userSpaceOnUse">
          {/* نجمة ثمانية: مربعان متراكبان بزاوية 45° */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            transform="translate(48 48)"
          >
            <rect x="-20" y="-20" width="40" height="40" />
            <rect
              x="-20"
              y="-20"
              width="40"
              height="40"
              transform="rotate(45)"
            />
            <circle r="4" />
          </g>
          {/* نقاط الأركان */}
          <circle cx="0" cy="0" r="1.5" fill="currentColor" />
          <circle cx="96" cy="0" r="1.5" fill="currentColor" />
          <circle cx="0" cy="96" r="1.5" fill="currentColor" />
          <circle cx="96" cy="96" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
