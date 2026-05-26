
export interface UserPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}


declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}