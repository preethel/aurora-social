import { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (authReq.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};
