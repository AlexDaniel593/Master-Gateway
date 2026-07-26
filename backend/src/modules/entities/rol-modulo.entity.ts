import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { Modulo } from './modulo.entity';

@Entity('rol_modulo')
export class RolModulo extends BaseEntity {
  @ManyToOne(() => Rol, (r) => r.rolModulos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @ManyToOne(() => Modulo, (m) => m.rolModulos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;
}
