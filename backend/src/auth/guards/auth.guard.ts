import { AuthGuard as PAuthGuard } from '@nestjs/passport'

export class AuthGuard extends PAuthGuard('jwt') {}