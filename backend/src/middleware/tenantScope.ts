import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  companyId?: string;
  branchId?: string;
  userRole?: string;
  userId?: string;
}

export const tenantScopeMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  // Extract tenant context from headers or query parameters
  const companyId = (req.headers['x-company-id'] as string) || (req.query.companyId as string) || 'comp-1';
  const branchId = (req.headers['x-branch-id'] as string) || (req.query.branchId as string);
  const userRole = (req.headers['x-user-role'] as string) || 'company_admin';
  const userId = (req.headers['x-user-id'] as string) || 'usr-admin-1';

  req.companyId = companyId;
  req.branchId = branchId;
  req.userRole = userRole;
  req.userId = userId;

  next();
};
