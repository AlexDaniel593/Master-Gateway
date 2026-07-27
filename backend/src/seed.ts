import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from './users/entities/usuario.entity';
import { Rol } from './roles/entities/rol.entity';
import { UsuarioRol } from './roles/entities/usuario-rol.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usuarioRepo = app.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  const rolRepo = app.get<Repository<Rol>>(getRepositoryToken(Rol));
  const usuarioRolRepo = app.get<Repository<UsuarioRol>>(
    getRepositoryToken(UsuarioRol),
  );

  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  const nombre = process.env.SEED_NOMBRE;
  const rolNombre = process.env.SEED_ROL;

  if (!email || !password || !nombre || !rolNombre) {
    console.log(
      'Seed omitido. Variables de entorno requeridas: SEED_EMAIL, SEED_PASSWORD, SEED_NOMBRE, SEED_ROL',
    );
    await app.close();
    return;
  }

  const usuarioExistente = await usuarioRepo.findOne({
    where: { email, estado: 'ACTIVO' },
  });
  if (usuarioExistente) {
    console.log('Usuario ya existe, omitiendo seed');
    await app.close();
    return;
  }

  const hash = await argon2.hash(password);
  const usuario = usuarioRepo.create({ email, passwordHash: hash, nombre });
  const savedUsuario = await usuarioRepo.save(usuario);
  console.log(`Usuario creado: ${email}`);

  let rol = await rolRepo.findOne({
    where: { nombre: rolNombre, estado: 'ACTIVO' },
  });
  if (!rol) {
    rol = rolRepo.create({
      nombre: rolNombre,
      descripcion: 'Rol administrador del sistema',
    });
    rol = await rolRepo.save(rol);
    console.log(`Rol creado: ${rolNombre}`);
  } else {
    console.log(`Rol ya existe: ${rolNombre}`);
  }

  const asignacionExistente = await usuarioRolRepo.findOne({
    where: { usuario: { id: savedUsuario.id }, rol: { id: rol.id } },
  });
  if (!asignacionExistente) {
    const ur = usuarioRolRepo.create({ usuario: savedUsuario, rol });
    await usuarioRolRepo.save(ur);
    console.log(`Usuario asignado al rol: ${rolNombre}`);
  }

  console.log('Seed completado');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
