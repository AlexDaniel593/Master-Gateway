import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp' })
  fechaActualizacion: Date;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string;

  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
  actualizadoPor: string;

  @BeforeInsert()
  setDefaults() {
    if (!this.estado) this.estado = 'ACTIVO';
  }
}
