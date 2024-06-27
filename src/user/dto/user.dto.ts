export class CreateUserDto {
    username: string;
    email: string;
}

export class UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    profilePicture?: string;
    isActive?: boolean;
}