import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import {log} from 'discord-logify'
const logger = new log()
export async function withAuth(req: NextRequest) {
    
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return {
        session: null,
        response: NextResponse.json(
          { error: 'unautorized' },
          { status: 401 }
        ),
      };
    }

    return {
      session,
      response: null,
    };
  } catch (error) {
    logger.Error('error'+ error);
    return {
      session: null,
      response: NextResponse.json(
        { error: 'server error' },
        { status: 500 }
      ),
    };
  }
}


export async function withAdminAuth(req: NextRequest) {
  const { session, response } = await withAuth(req);

  if (response) {
   
    return { session: null, response };
  }

  const userRole = session?.user?.role ?? '';
  if (!["admin", "staff","coach"].includes(userRole)) {
     logger.Alert("someone is trying to get data of an staff")
    return {
        
      session: null,
      response: NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ),
    };
  }

  return { session, response: null };
}



export async function withRoleAuth(req: NextRequest, allowedRoles: string[]) {
  const { session, response } = await withAuth(req);

  if (response) {
    return { session: null, response };
  }

  if (!allowedRoles.includes(session?.user.role || '')) {
    logger.Alert("someone has try to access with not allowed roles "+req.url)
    return {
      session: null,
      
      response: NextResponse.json(
        { error: `Access denied` },
        { status: 403 }
      ),
    };
  }

  return { session, response: null };
}
