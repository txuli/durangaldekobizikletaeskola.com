"use client";

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import React, { useState, useEffect } from "react";
import Image from "next/legacy/image";
import LocaleSwitcherSelect from './LocaleSwitcherSelect';
import imageLogo from "@/app/media/DURANGOALDEKO.png";
import logoMenu from "@/app/media/menu/logoMenu.svg";
import logoMenuCose from "@/app/media/menu/close.svg";

interface nProps {
  
  className?: string;
  color2?: string;
}
const NavBar: React.FC<nProps> = ({ className = "", color2 = "" }) => {
  const [isRotated, setIsRotated] = useState(false);
  const [logo, setLogo] = useState(logoMenu);
  const handleClick = () => {
    setIsRotated(!isRotated);
    setLogo(isRotated ? logoMenu : logoMenuCose);
  };
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("menuComponent");
  const toggleMenu = () => {
    if (menuOpen) {
      
      setLogo(logoMenu);
      setIsRotated(false);
    }
    setMenuOpen(prevState => !prevState);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1250);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full bg-gradient-to-r ${className ? className : 'bg-customblue'} shadow-md z-20 font-fredoka`}>

      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/">
          <Image src={imageLogo} alt="Logo" className="h-16 w-auto cursor-pointer" />
        </Link>

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className={`h-8 w-8 cursor-pointer  transition-transform duration-500 ease-in-out z-30  ${isRotated ? 'rotate-90' : ''}`}
            aria-label="Toggle menu"
          >
            <Image
              src={logo}
              alt="Menu"
              className={`h-8 w-8 cursor-pointer invert ${isRotated ? 'rotate-90' : ''}`}
              onClick={handleClick}
            />
          </button>
        )}

        {/* Desktop Links */}
        {!isMobile && (
          <div className="flex items-center space-x-6">
            <Link href="/eskola" className="text-white hover:text-blue-200 transition duration-150">
              {t("eskola")}
            </Link>
            <Link href="/cafedromedario" className="text-white hover:text-blue-200 transition duration-150">
              CAFÉ DROMEDARIO-FLOTAMET
            </Link>
              <Link href="/puntagalea" className="text-white hover:text-customPuntagaleaDarkOrange transition duration-150">
             PUNTAGALEA OCCIDENT
            </Link>  
              <Link href="/galeria" className="text-white hover:text-blue-200 transition duration-150">
               GALERIA
            </Link>   
            <Link href="/form" className="text-white hover:text-blue-200 transition duration-150">
              {t("form")}
            </Link>
             {/* <Link href="/clothes" className="text-white hover:text-blue-200 transition duration-150">
              ARROPA
            </Link>  */}
            <Link href="/contacto" className="text-white hover:text-blue-200 transition duration-150">
              {t("contact")}
            </Link>

          </div>
        )}

        {/* Language Switch and Login */}
        {!isMobile && (
          <div className="flex items-center space-x-4">
           {/* <Link
            href="/login"
            className="bg-customDarkBlue text-white px-4 py-2 rounded-lg "
          >
            HASI SAIOA
          </Link>  */}
            <div className="hidden md:flex items-center space-x-2">

              <LocaleSwitcherSelect className={color2} />



            </div>

          </div>)}
      </div>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div className="absolute top-0 left-0 w-full h-screen bg-black/70 flex flex-col items-center justify-center space-y-6 text-white z-20">
          <Link
            href="/"
            className="text-xl hover:text-blue-300 transition duration-150"
             onClick={toggleMenu}
          >
            {t("home")}
          </Link>
          <Link
            href="/eskola"
            className="text-xl hover:text-blue-300 transition duration-150"
             onClick={toggleMenu}
          >
            {t("eskola")}
          </Link>
          <Link
            href="/cafedromedario"
            className="text-xl hover:text-blue-300 transition duration-150"
            onClick={toggleMenu}
          >
            CAFÉ DROMEDARIO-FLOTAMET
          </Link>
           <Link
            href="/puntagalea"
            className="text-xl hover:text-blue-300 transition duration-150"
            onClick={toggleMenu}
          >
            PUNTAGALEA OCCIDENT
          </Link> 
           <Link
            href="/galeria"
            className="text-xl hover:text-blue-300 transition duration-150"
            onClick={toggleMenu}
          >
           GALERIA
          </Link> 
          <Link
            href="/form"
            className="text-xl hover:text-blue-300 transition duration-150"
            onClick={toggleMenu}
          >
            {t("form")}
          </Link>
          <Link
            href="/contacto"
            className="text-xl hover:text-blue-300 transition duration-150"
            onClick={toggleMenu}
          >
            {t("contact")}
          </Link>
          {/* <Link
            href="/login"
            className="text-xl bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-150"
            onClick={toggleMenu}
          >
            HASI SAIOA
          </Link> */}
          <div>
          <LocaleSwitcherSelect className={color2} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
