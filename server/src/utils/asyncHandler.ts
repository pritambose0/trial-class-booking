import type { Request, Response, NextFunction } from "express";

const asyncHandler = <T extends Request = Request>(
    execution: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: T, res: Response, next: NextFunction) => {
        Promise.resolve(execution(req, res, next)).catch(next);
    };
};

export { asyncHandler };
