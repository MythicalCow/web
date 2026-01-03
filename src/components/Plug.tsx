"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import AsciiPlug from "./AsciiPlug";

interface PlugProps {
  isPlugged: boolean;
  onPlugChange: (plugged: boolean) => void;
  graphicsCardRef: React.RefObject<HTMLDivElement>;
}

export default function Plug({ isPlugged, onPlugChange, graphicsCardRef }: PlugProps) {
  const plugRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  const checkConnection = useCallback(() => {
    if (!graphicsCardRef.current || !plugRef.current) return;

    // Find the actual <pre> element that contains the ASCII art
    const preElement = graphicsCardRef.current.querySelector('pre');
    if (!preElement) return;

    const cardRect = preElement.getBoundingClientRect(); // Use pre element, not container
    const plugRect = plugRef.current.getBoundingClientRect();
    
    // Connection point: right edge of actual ASCII art, vertically centered
    const connectionX = cardRect.right;
    const connectionY = cardRect.top + cardRect.height / 2;
    
    // Plug connector is on the left side, so check left edge alignment
    const plugLeftX = plugRect.left;
    const plugCenterY = plugRect.top + plugRect.height / 2;
    
    const distanceX = Math.abs(plugLeftX - connectionX);
    const distanceY = Math.abs(plugCenterY - connectionY);
    
    // Allow small horizontal gap (for the connector pins) and vertical alignment
    const thresholdX = 15; // pixels - allows connector to be slightly to the right
    const thresholdY = 20; // pixels - vertical alignment tolerance
    
    const shouldBePlugged = distanceX < thresholdX && distanceY < thresholdY;
    
    if (shouldBePlugged !== isPlugged) {
      onPlugChange(shouldBePlugged);
    }
  }, [graphicsCardRef, isPlugged, onPlugChange]);

  // Initialize plug position - start plugged in
  useEffect(() => {
    if (!graphicsCardRef.current || initialized) return;

    const updatePosition = () => {
      if (!graphicsCardRef.current) return;
      
      // Find the actual <pre> element that contains the ASCII art
      const preElement = graphicsCardRef.current.querySelector('pre');
      if (!preElement) return;
      
      const cardRect = preElement.getBoundingClientRect(); // Use pre element, not container
      
      // Start plugged in - align left edge of plug with right edge of actual ASCII art
      // Plug connector is on the left, so position it right next to the card
      const connectionX = cardRect.right;
      const connectionY = cardRect.top + cardRect.height / 2;
      
      setPosition({ x: connectionX, y: connectionY });
    };

    // Wait a bit for layout to settle
    const timer = setTimeout(() => {
      updatePosition();
      setInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [graphicsCardRef, initialized]);

  // Check if plug is near connection point while dragging
  useEffect(() => {
    if (!isDragging || !initialized) return;
    checkConnection();
  }, [position, isDragging, initialized, checkConnection]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!plugRef.current) return;
    
    const rect = plugRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Check connection when released
    setTimeout(() => checkConnection(), 10);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Snap to connection point when plugged
  useEffect(() => {
    if (!isPlugged || !graphicsCardRef.current || !initialized || isDragging) return;

    const updatePluggedPosition = () => {
      // Find the actual <pre> element that contains the ASCII art
      const preElement = graphicsCardRef.current?.querySelector('pre');
      if (!preElement) return;
      
      const cardRect = preElement.getBoundingClientRect(); // Use pre element, not container
      
      // Align plug's left edge with card's right edge (actual ASCII art edge)
      const connectionX = cardRect.right;
      const connectionY = cardRect.top + cardRect.height / 2;
      
      setPosition({
        x: connectionX,
        y: connectionY,
      });
    };

    updatePluggedPosition();
    
    // Update position on resize
    window.addEventListener('resize', updatePluggedPosition);
    return () => window.removeEventListener('resize', updatePluggedPosition);
  }, [isPlugged, graphicsCardRef, initialized, isDragging]);

  return (
    <div
      ref={plugRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateY(-50%)",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: 1000,
        transition: isPlugged && !isDragging ? "all 0.2s ease" : "none",
      }}
      className="select-none"
    >
      <div
        className={`transition-all duration-200 ${
          isPlugged ? "opacity-100" : "opacity-80"
        }`}
      >
        <AsciiPlug isPlugged={isPlugged} />
      </div>
    </div>
  );
}

