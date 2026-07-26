import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UsuarioRol } from './usuario-rol.entity';
import { RolModulo } from '../../modules/entities/rol-modulo.entity';
import { RolMenu } from '../../menus/entities/rol-menu.entity';

@Entity('roles')
export class Rol extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => UsuarioRol, (ur) => ur.rol)
  usuarioRoles: UsuarioRol[];

  @OneToMany(() => RolModulo, (rm) => rm.rol)
  rolModulos: RolModulo[];

  @OneToMany(() => RolMenu, (rm) => rm.rol)
  rolMenus: RolMenu[];
}
