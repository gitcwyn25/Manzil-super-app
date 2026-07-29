import { IsString, MaxLength, MinLength } from "class-validator";

export class ConsoleLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(190)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password!: string;
}
