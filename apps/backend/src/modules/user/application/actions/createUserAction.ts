import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { User } from '../../domain/types/user.ts';
import type { PasswordService } from '../services/passwordService.ts';

export interface CreateUserActionPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export class CreateUserAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly passwordService: PasswordService;

  public constructor(userRepository: UserRepository, loggerService: LoggerService, passwordService: PasswordService) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.passwordService = passwordService;
  }

  public async execute(payload: CreateUserActionPayload): Promise<User> {
    const { name, email: emailRaw, password } = payload;

    const email = emailRaw.toLowerCase();

    this.loggerService.debug({
      message: 'Creating user...',
      email,
    });

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ResourceAlreadyExistsError({
        resource: 'User',
        reason: 'User with this email already exists',
        email,
      });
    }

    this.passwordService.validatePassword(password);

    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    this.loggerService.info({
      message: 'User created successfully.',
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}
