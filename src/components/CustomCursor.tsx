import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const glowPositionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer");
      setIsHovering(!!isInteractive);
    };

    // Smooth animation loop using requestAnimationFrame
    const animate = () => {
      const cursor = cursorRef.current;
      const glow = glowRef.current;
      
      if (cursor && glow) {
        // Direct position update for cursor (no lag)
        cursor.style.left = `${positionRef.current.x}px`;
        cursor.style.top = `${positionRef.current.y}px`;
        
        // Smooth interpolation for glow (slight trail effect)
        const lerp = 0.15;
        glowPositionRef.current.x += (positionRef.current.x - glowPositionRef.current.x) * lerp;
        glowPositionRef.current.y += (positionRef.current.y - glowPositionRef.current.y) * lerp;
        
        glow.style.left = `${glowPositionRef.current.x}px`;
        glow.style.top = `${glowPositionRef.current.y}px`;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("mouseover", handleMouseOver);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="eco-cursor"
      />
      <div
        ref={glowRef}
        className={`eco-cursor-glow ${isHovering ? "hovering" : ""}`}
      />
    </>
  );
}
