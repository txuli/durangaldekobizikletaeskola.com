"use client";

import React from "react";
import Image from "next/image";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "76vh",
  width: "100%",
  position: "relative",
};

const captionStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "30px",
  left: "20px",
  color: "#fff",
  textShadow: "0 2px 5px rgba(0, 0, 0, 0.5)",
  zIndex: 10,
};

interface ImageSlide {
  url: string;
  alt?: string;
}

interface SlideshowProps {
  images: ImageSlide[];
  title: string;
}

const Slides: React.FC<SlideshowProps> = ({ images = [], title }) => {
  return (
    <div className="slide-container w-full h-auto mx-auto relative">
      <h1 style={captionStyle} className="font-fredoka text-4xl sm:text-5xl font-semibold">
        {title}
      </h1>

      <Slide
        duration={4000}
        transitionDuration={1000}
        infinite
        indicators={false}
        arrows={false}
        autoplay
      >
        {images.map((slideImage, index) => (
          <div key={index} style={containerStyle}>
            <Image
              src={slideImage.url}
              alt={slideImage.alt || `Slide ${index + 1}`}
              fill
              style={{ objectFit: "cover" }}
              priority={index === 0} // prioridad a la primera imagen
            />
          </div>
        ))}
      </Slide>
    </div>
  );
};

export default Slides;
