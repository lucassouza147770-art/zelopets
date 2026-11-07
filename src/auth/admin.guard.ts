import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: { papel?: string } }>();
    if (request.user?.papel !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito à equipe administrativa');
    }
    return true;
  }
}
