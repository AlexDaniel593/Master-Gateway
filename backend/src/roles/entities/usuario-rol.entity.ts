import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Rol } from './rol.entity';

@Entity('usuario_rol')
export class UsuarioRol extends BaseEntity {
  @ManyToOne(() => Usuario, (u) => u.usuarioRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Rol, (r) => r.usuarioRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}
