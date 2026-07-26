import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RolModulo } from './rol-modulo.entity';
import { Menu } from '../../menus/entities/menu.entity';

@Entity('modulos')
export class Modulo extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => RolModulo, (rm) => rm.modulo)
  rolModulos: RolModulo[];

  @OneToMany(() => Menu, (m) => m.modulo)
  menus: Menu[];
}
