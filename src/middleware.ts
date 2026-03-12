import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

// Middleware de next-intl para rutas públicas
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Las rutas de API son protegidas en sus propias rutas usando withAuth
  // El middleware principal solo se encarga de la internacionalización
  
  // Para rutas públicas (renderizado SSR/SSG), usar middleware de next-intl
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(eus|es)/:path*']
};

// Nota: La protección de sesión para API se maneja en:
// - src/lib/api-auth.ts (helpers de autenticación)
// - Cada ruta de API debe usar withAuth(), withAdminAuth() o withRoleAuth()
// - Ver MIDDLEWARE_AUTH.md para documentación completa