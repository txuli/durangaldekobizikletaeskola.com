import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['photos.txuli.com'], // Agrega aquí el dominio externo desde el que quieres cargar imágenes
  },
  
};



export default withNextIntl (nextConfig);
