import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UsuarioRol } from '../../roles/entities/usuario-rol.entity';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @OneToMany(() => UsuarioRol, (ur) => ur.usuario)
  usuarioRoles: UsuarioRol[];
}
