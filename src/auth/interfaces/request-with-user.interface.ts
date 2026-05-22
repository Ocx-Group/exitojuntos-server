import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    phone: string;
    role: string;
  };
}
