import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Modulo } from '../../modules/entities/modulo.entity';
import { RolMenu } from './rol-menu.entity';

@Entity('menus')
export class Menu extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @ManyToOne(() => Modulo, (m) => m.menus, { nullable: false })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;

  @ManyToOne(() => Menu, (m) => m.hijos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  padre: Menu | null;

  @OneToMany(() => Menu, (m) => m.padre)
  hijos: Menu[];

  @OneToMany(() => RolMenu, (rm) => rm.menu)
  rolMenus: RolMenu[];
}
