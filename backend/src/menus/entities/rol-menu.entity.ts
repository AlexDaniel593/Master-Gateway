import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { Menu } from './menu.entity';

@Entity('rol_menu')
export class RolMenu extends BaseEntity {
  @ManyToOne(() => Rol, (r) => r.rolMenus, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @ManyToOne(() => Menu, (m) => m.rolMenus, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
