import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'clerk_user_id', type: 'varchar', length: 255 })
  clerkUserId!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export interface UserDto {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export function toUserDto(entity: UserEntity): UserDto {
  return {
    id: entity.id,
    clerkUserId: entity.clerkUserId,
    email: entity.email,
    name: entity.name,
    avatarUrl: entity.avatarUrl,
    createdAt: entity.createdAt,
  };
}
