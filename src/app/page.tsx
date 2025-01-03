'use client';
import React, { useEffect, useState } from "react";
import {List, XLogo, GithubLogo, LinkedinLogo} from '@phosphor-icons/react';

const generateBlobPath = (size: number) => {
  const points = [];
  const numPoints = 8;
  const angleStep = (Math.PI * 2) / numPoints;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    const radius = size / 2 * (0.8 + Math.random() * 0.4); // Randomize radius
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    points.push([x, y]);
  }
  
  // Create SVG path
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i <= points.length; i++) {
    const current = points[i % points.length];
    const next = points[(i + 1) % points.length];
    const controlX = (current[0] + next[0]) / 2 + (Math.random() - 0.5) * 50;
    const controlY = (current[1] + next[1]) / 2 + (Math.random() - 0.5) * 50;
    path += ` Q ${controlX} ${controlY} ${next[0]} ${next[1]}`;
  }
  path += ' Z';
  return path;
};

interface FloatingShapeProps {
  color: string;
  initialPosition: { x: number; y: number };
  size: number;
}

const FloatingShape: React.FC<FloatingShapeProps> = ({ color, initialPosition, size }) => {
  const [blobPath] = useState(() => generateBlobPath(size));
  
  useEffect(() => {
    const duration = 25000 + Math.random() * 10000;
    const newX = Math.random() * window.innerWidth;
    const newY = Math.random() * window.innerHeight;
    
    const animation = `
      @keyframes float-${initialPosition.x}-${initialPosition.y} {
        0% { transform: translate(${initialPosition.x}px, ${initialPosition.y}px) rotate(0deg); }
        50% { transform: translate(${newX}px, ${newY}px) rotate(${Math.random() * 360}deg); }
        100% { transform: translate(${initialPosition.x}px, ${initialPosition.y}px) rotate(360deg); }
      }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.textContent = animation;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [initialPosition]);

  return (
    <svg
      className="absolute mix-blend-screen animate-pulse blur-[40px]"
      style={{
        width: size * 1.2,
        height: size * 1.2,
        opacity: 0.15,
        filter: 'blur(40px)',
        animation: `float-${initialPosition.x}-${initialPosition.y} 15s infinite ease-in-out`
      }}
      viewBox={`${-size/2} ${-size/2} ${size} ${size}`}
    >
      <path
        d={blobPath}
        fill={color}
        opacity={0.4}
      />
    </svg>
  );
};

const titles = ["COMPUTER ENGINEER", "DESIGNER", "BUILDER", "WRITER"];
let currentTitleIndex = 0;

const updateTitle = () => {
  currentTitleIndex = (currentTitleIndex + 1) % titles.length;
  const titleElement = document.getElementById("rotating-title");
  if (titleElement) {
    titleElement.textContent = titles[currentTitleIndex];
  }
};

export default function Home() {
  const [shapes, setShapes] = useState<{ id: number; color: string; position: { x: number; y: number }; size: number }[]>([]);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    updateTitle(); // Set initial title
    const intervalId = setInterval(updateTitle, 1000); // Update every 3 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const colors = [
      'rgb(138, 43, 226)', // violet
      'rgb(0, 191, 255)',  // deep sky blue
      'rgb(255, 20, 147)', // deep pink
      'rgb(50, 205, 50)',  // lime green
      'rgb(255, 140, 0)',  // dark orange
      'rgb(255, 0, 255)',  // magenta
    ];
    
    // Create shapes with better distribution, centered horizontally
    const newShapes = Array.from({ length: 12 }, (_, i) => {
      const sectionX = i % 3;
      const sectionY = Math.floor(i / 3);
      
      return {
        id: i,
        color: colors[i % colors.length],
        position: {
          x: (window.innerWidth / 2) + (Math.random() * window.innerWidth / 6) * (Math.random() > 0.5 ? 1 : -1),
          y: (window.innerHeight / 2) + (Math.random() * window.innerHeight / 6) * (Math.random() > 0.5 ? 1 : -1)
        },
        size: 120 + Math.random() * 160
      };
    });
    
    setShapes(newShapes);
  }, []);

  return (
    <main className="bg-[#141414] flex min-h-screen flex-col items-center justify-between">
      <div className="bg-[#141414] w-full h-screen relative pb-60"> {/* Added relative for mobile menu positioning */}
        {/* Centered Text */}
        <div className="text-white text-center h-screen w-screen py-[50vh]">
          <div className="" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {shapes.map((shape) => (
              <FloatingShape
                key={shape.id}
                color={shape.color}
                initialPosition={shape.position}
                size={shape.size}
              />
            ))}
          </div>
          <h1 className="mx-auto text-5xl pl-4 pr-4 text-center sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl ps-4">HI, I&apos;M RAGHAV</h1>
          <h1 id="rotating-title" className="mx-auto text-4xl pt-20">COMPUTER ENGINEER</h1>
          <h1 id="rotating-title" className="mx-auto text-4xl text-gray-500 pt-2">@ {'UIUC'}</h1>
        </div>

        {/* Navbar */}
        <div className="fixed top-0 w-full px-4 pt-4 z-50">
          <nav className="mx-auto max-w-6xl bg-[#1a1a1a]/20 backdrop-blur-md rounded-full border border-[#1b1b1b]/100">
            <div className="px-6 lg:px-8">
              <div className="grid grid-cols-3 items-center h-14 relative"> {/* Added relative here too */}
                <div className="w-[104px] hidden lg:block"></div>

                <div className="flex items-center justify-center space-x-8 lg:flex hidden"> {/* Hide on mobile */}
                  <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">HOME</a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">ABOUT</a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">POSTS</a>
                </div>

                <div className="flex items-center justify-end space-x-6">
                  <div className="lg:flex hidden space-x-6"> {/* Hide on mobile */}
                    <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><XLogo size={32} /></a>
                    <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><LinkedinLogo size={32} /></a>
                    <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><GithubLogo size={32} /></a>
                  </div>
                  <button onClick={toggleMobileMenu} className="lg:hidden text-white absolute right-0"> {/* Mobile menu button */}
                    <List size={32} />
                  </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                  <div className="absolute top-full right-0 bg-[#1a1a1a]/20 backdrop-blur-md rounded-b-lg border-b border-[#1b1b1b]/100 py-4 w-full lg:hidden z-10"> {/* Added w-full and lg:hidden */}
                    <div className="flex flex-col items-end"> {/* Right-aligned content */}
                      <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium py-2">HOME</a>
                      <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium py-2">ABOUT</a>
                      <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium py-2">POSTS</a>
                      <div className="flex space-x-6 mt-4">
                        <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><XLogo size={32} /></a>
                        <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><LinkedinLogo size={32} /></a>
                        <a href="#" className="text-white hover:text-gray-300 transition-colors duration-200"><GithubLogo size={32} /></a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
      {/* about section */}
      <section className="bg-[#1a1a1a]/20 backdrop-blur-md rounded-2xl px-8 py-16 mx-auto mt-16 max-w-4xl ml-4 mr-4">
        <h2 className="text-4xl text-white font-semibold mb-8">BIO</h2>
        <div className="text-2xl text-gray-400 leading-relaxed">
          <p className="mb-6">
            Currently building systems to detect and disrupt unmanned aerial systems at Guardian RF (YC S24).
          </p>
          <p className="mb-6">
            Worked at Khoj AI (YC S23) to build an open-source AI assistant that currently has 17k+ stars on GitHub.
          </p>
          <p className="mb-6">
            Worked as an embedded software lead at Illinois Electric Motorsports, a premier college FSAE team.
          </p>
          <p className="mb-6">
            Computer Engineering @ UIUC
          </p>
        </div>
      </section>

    </main>
  );
}
