import React from 'react';
import { OceanicBackground3D } from './view/OceanicBackground3D.js';
import { OceanicBrandHeader } from './view/OceanicBrandHeader.js';
import { OceanicLoginCard } from './view/OceanicLoginCard.js';
import { OceanicKpiPill } from './view/OceanicKpiPill.js';
import { useLoginController } from './controller/useLoginController.js';

/**
 * ROOT VIEW: Oceanic Marine Boat Company Management System Login Page
 * - Built using React, Vite, Tailwind CSS, Framer Motion and Three.js
 * - Follows clean Model-View-Controller (MVC) architecture
 * - Realistic 3D ocean background with animated fishing boat ("OMC-102") floating & rocking
 * - Glassmorphic login card with Admin Login & Manager Login tabs
 * - Floating glassmorphism KPI pill (20+ Employees, 5 Boats, 3 At Sea, 2 At Harbour)
 * - Fully responsive across mobile, tablet, laptop, and ultra-wide displays
 */
export const LoginView: React.FC = () => {
  const controller = useLoginController();

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden flex flex-col justify-between bg-[#06334f]">
      {/* 1. Realistic Interactive 3D Ocean & Fishing Boat Scene */}
      <OceanicBackground3D />

      {/* 2. Measured Contrast Vignette Scrim (Ensures full accessibility & readable text over 3D waves) */}
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-sky-950/40 via-transparent to-sky-950/30 z-0"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* 3. Main Responsive Workspace Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-between">
        {/* Top & Middle Section: Left Brand Hero & Right Glassmorphic Login Card */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 my-auto">
          {/* Left Column (Span 6-7 on Desktop) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 pt-2 lg:pt-0">
            <OceanicBrandHeader />
          </div>

          {/* Right Column: Glassmorphism Login Card (Span 5-6 on Desktop) */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <OceanicLoginCard
              activeRole={controller.activeRole}
              identifier={controller.identifier}
              password={controller.password}
              showPassword={controller.showPassword}
              rememberMe={controller.rememberMe}
              isLoading={controller.isLoading}
              errorMsg={controller.errorMsg}
              onRoleChange={controller.switchRole}
              onIdentifierChange={controller.setIdentifier}
              onPasswordChange={controller.setPassword}
              onTogglePasswordVisibility={controller.togglePasswordVisibility}
              onRememberMeChange={controller.setRememberMe}
              onSubmit={controller.handleSubmit}
            />
          </div>
        </div>

        {/* Bottom Section: Floating Glassmorphism KPI Pill Bar */}
        <div className="pt-6 sm:pt-8 pb-2 flex items-center justify-center lg:justify-start">
          <OceanicKpiPill />
        </div>
      </div>
    </div>
  );
};
