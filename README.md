# Master Gateway

**Sistema Centralizado de Autenticacion y Autorizacion** construido bajo principios de **Shift-Left Security** y **Zero Trust Architecture**. Actua como gateway de seguridad y routing para un ecosistema de microservicios, proporcionando autenticacion multifase, control de acceso basado en roles (RBAC), menu dinamico recursivo y un endpoint de validacion interna para microservicios hijos.

> **Universidad de las Fuerzas Armadas ESPE** - Desarrollo de Software Seguro  
> Prof. Geovanny Cudco - Julio 2026

---

## Ejecucion con Docker Compose

### Requisitos

- Docker Engine 20.10+
- Docker Compose v2+

### Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```env
POSTGRES_USER=master_gateway
POSTGRES_PASSWORD=master_gateway
POSTGRES_DB=master_gateway

DATABASE_URL=postgresql://master_gateway:master_gateway@db:5432/master_gateway
JWT_SECRET=tu-secreto-aqui
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

SEED_EMAIL=admin@example.com
SEED_PASSWORD=Admin123!
SEED_NOMBRE=Admin
SEED_ROL=admin
```

### Levantar la aplicacion

```bash
# Construir y levantar todos los servicios
docker compose up --build -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Detener y eliminar volumenes (reset completo de la DB)
docker compose down -v
```

### Servicios

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend (Next.js) | http://localhost:3001 | 3001 |
| Backend API (NestJS) | http://localhost:3000 | 3000 |
| PostgreSQL | localhost:5432 | 5432 |

---

## Arquitectura de la Aplicacion

```mermaid
graph TB
    User((Usuario))
    User -->|Navegador| Frontend

    subgraph Frontend[Frontend - Next.js 16]
        Login[Pagina Login]
        RoleSelect[Selector de Rol]
        Dashboard[Dashboard Layout]
        Sidebar[Sidebar - Menu Dinamico]
        CRUD[CRUD: Usuarios, Roles, Modulos, Menus]
        Login --> RoleSelect --> Dashboard
        Dashboard --> Sidebar
        Dashboard --> CRUD
    end

    subgraph Backend[Backend - NestJS 11]
        Auth[Auth Module]
        Users[Users Module]
        Roles[Roles Module]
        Modules[Modules Module]
        Menus[Menus Module]
        Internals[Internals Module]
    end

    subgraph DB[PostgreSQL]
        Database[(Base de Datos)]
    end

    subgraph Pipeline[CI/CD - GitHub Actions]
        Build[Build and Test]
        SAST[SAST: SonarQube, CodeBERT, Trivy]
        Deploy[Deploy a Render]
    end

    subgraph Child[Microservicios Hijos]
        Child1[Servicio Ventas]
        Child2[Servicio Inventario]
        ChildN[...]
    end

    Frontend -->|HTTP Axios - JWT| Backend
    Backend -->|TypeORM| Database
    Child1 -->|POST /api/internals/validate-token| Internals
    Child2 -->|POST /api/internals/validate-token| Internals
    GitHub[Push / PR] --> Pipeline
    Pipeline -->|Notificaciones| Telegram[Telegram Bot]

    classDef frontend fill:#1e3a5f,color:#fff
    classDef backend fill:#2d6a4f,color:#fff
    classDef db fill:#4a4a4a,color:#fff
    classDef pipeline fill:#6b3fa0,color:#fff
    classDef child fill:#8b4513,color:#fff
    class Frontend,Login,RoleSelect,Dashboard,Sidebar,CRUD frontend
    class Auth,Users,Roles,Modules,Menus,Internals backend
    class Database db
    class Build,SAST,Deploy pipeline
    class Child1,Child2,ChildN child
```

---

## Arquitectura del Pipeline de CI/CD

![Pipeline Architecture](docs/images/pipeline-architecture.jpeg)

El pipeline se compone de tres workflows de GitHub Actions que implementan integracion continua, analisis de seguridad SAST y despliegue automatico:

### Workflow: build.yml

| Disparo | Accion |
|---|---|
| Push a `dev`, `test`, `main` | Ejecuta lint, compilacion y tests unitarios |
| PR hacia `dev`, `test`, `main` | Valida origen de la rama (solo dev permite PR) |
| Auto-merge `dev` a `test` | Automatico si los tests pasan |
| Auto-merge `test` a `main` | Automatico con label `auto-merge` |

### Workflow: sast.yml

| Etapa | Herramienta | Proposito |
|---|---|---|
| 1 | SonarQube Community | Analisis de codigo estatico con Quality Gate personalizado |
| 2 | CodeBERT (HuggingFace) | Modelo ML `mrm8488/codebert-base-finetuned-detect-insecure-code` para deteccion de codigo inseguro |
| 3 | Trivy | Escaneo de vulnerabilidades en dependencias (filesystem scan) |
| 4 | Quality Gate | Validacion estricta: 0 bugs, 0 vulnerabilidades, 0 code smells, 0 duplicacion en codigo nuevo |
| 5 | Reportes | Generacion de reporte consolidado en GitHub Actions Summary |

### Workflow: deploy.yml

| Disparo | Accion |
|---|---|
| Push a `main` | Despliega automaticamente en Render via webhook |
| `workflow_dispatch` manual | Permite despliegue manual desde GitHub |

### Notificaciones

Todas las etapas de los tres workflows envian notificaciones a Telegram mediante `appleboy/telegram-action`, informando:
- Inicio del workflow
- Resultado de cada etapa (exito/fallo)
- Metricas de SAST (bugs, vulnerabilidades, code smells, ratings, conteo Trivy)

---

## Flujo de Autenticacion (2 Fases)

### Fase 1: Login

```
Cliente                    Servidor                     Base de Datos
  |                           |                              |
  |-- POST /api/auth/login -->|                              |
  |   {email, password}       |                              |
  |                           |-- SELECT * FROM usuarios --->|
  |                           |<-- usuario + passwordHash ---|
  |                           |                              |
  |                           |-- Verifica Argon2 hash ------|
  |                           |-- SELECT roles del usuario ->|
  |                           |<-- lista de roles -----------|
  |                           |                              |
  |<-- 200 {tempToken, -------|                              |
  |    roles[]}               |                              |
```

- El usuario ingresa email y password
- El servidor valida contra Argon2 (hash)
- Se genera un `tempToken` con validez de **5 minutos**
- Se devuelve la lista de roles disponibles del usuario

### Fase 2: Seleccion de Rol

```
Cliente                    Servidor                     Base de Datos
  |                           |                              |
  |-- POST /api/auth/--------|                              |
  |   select-role             |                              |
  |   {tempToken, rolId}      |                              |
  |                           |-- Valida tempToken ---------|
  |                           |-- Verifica que el usuario ---|
  |                           |   pertenece al rol           |
  |                           |                              |
  |<-- 200 {accessToken, -----|                              |
  |    refreshToken,           |                              |
  |    rol, menus[]}           |                              |
```

- El usuario selecciona un rol especifico
- El servidor valida el `tempToken` y la pertenencia del usuario al rol
- Se genera `accessToken` (validez **15 minutos**) con el `rolId` y `rolNombre` en el payload
- Se genera `refreshToken` (validez **7 dias**) para renovacion automatica
- Se devuelve el arbol de menus correspondiente al rol

### Fase 3: Menu Dinamico

- El frontend solicita `GET /api/menus/tree` con el `accessToken`
- El backend ejecuta una consulta recursiva con `WITH RECURSIVE` (PostgreSQL CTE)
- Se construye el arbol de navegacion completo basado en los modulos y menus asignados al rol
- El sidebar del dashboard se renderiza dinamicamente desde esta estructura

### Refresh Token

- Cuando el `accessToken` expira, el interceptor de Axios detecta el error 401
- Automaticamente llama a `POST /api/auth/refresh-token` con el `refreshToken`
- Obtiene un nuevo `accessToken` sin intervencion del usuario
- Implementa cola de peticiones para evitar condiciones de carrera durante la renovacion

---

## Stack Tecnologico Detallado

| Capa | Tecnologia | Version | Proposito |
|---|---|---|---|
| **Backend Framework** | NestJS | 11.x | Framework Node.js modular y escalable |
| **Frontend Framework** | Next.js | 16.2.11 | React framework con App Router |
| **Lenguaje** | TypeScript | 5.x | Tipado estatico |
| **ORM** | TypeORM | 1.1.x | Mapeo objeto-relacional con PostgreSQL |
| **Base de Datos** | PostgreSQL | 16 | Base de datos relacional |
| **Autenticacion** | Passport.js + passport-jwt | - | Estrategia JWT para autenticacion |
| **Hashing** | Argon2 | - | Hashing seguro de contraseñas (ganador PHC) |
| **Validacion** | class-validator / class-transformer | - | Validacion de DTOs con decoradores |
| **Estado Frontend** | Zustand | 5.x | Estado global liviano con persistencia |
| **UI** | Radix UI + Tailwind CSS | 4.x | Componentes accesibles y estilizados |
| **Iconos** | Lucide React | - | Iconos SVG modernos |
| **HTTP Client** | Axios | - | Cliente HTTP con interceptores |
| **Formularios** | Zod + Conform | - | Validacion de formularios en frontend |
| **Frontend State** | Zustand | 5.x | Manejo de estado con persistencia localStorage |
| **Contenedor** | Docker | Alpine Node 22 | Multi-stage build para produccion |
| **CI/CD** | GitHub Actions | - | Automatizacion de build, test, deploy |
| **SAST** | SonarQube | Community | Analisis estatico de codigo |
| **ML SAST** | CodeBERT | mrm8488 | Deteccion de codigo inseguro con IA |
| **Vulnerabilities** | Trivy | - | Escaneo de dependencias |
| **Mensajeria** | Telegram Bot | - | Notificaciones del pipeline |

---

## Modulos del Backend

### AuthModule (`/api/auth`)

| Endpoint | Metodo | Body | Respuesta | Descripcion |
|---|---|---|---|---|
| `/api/auth/login` | POST | `{email, password}` | `{tempToken, roles[]}` | Inicio de sesion (1ra fase) |
| `/api/auth/select-role` | POST | `{tempToken, rolId}` | `{accessToken, refreshToken, rol, menus[]}` | Seleccion de rol (2da fase) |
| `/api/auth/refresh-token` | POST | `{refreshToken}` | `{accessToken, refreshToken}` | Renovacion de tokens |
| `/api/auth/logout` | POST | `{refreshToken}` | `{message}` | Cierre de sesion |

### UsersModule (`/api/users`)

CRUD completo de usuarios con soft-delete, paginacion y hashing Argon2.

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/users` | GET | Lista paginada de usuarios |
| `/api/users` | POST | Crear usuario (hash automatico de password) |
| `/api/users/:id` | GET | Obtener usuario por ID |
| `/api/users/:id` | PUT | Actualizar usuario |
| `/api/users/:id` | DELETE | Soft-delete (cambia estado a INACTIVO) |

### RolesModule (`/api/roles`)

CRUD de roles con asignacion M:N de usuarios. No permite eliminar roles con usuarios activos.

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/roles` | GET | Lista de roles |
| `/api/roles` | POST | Crear rol |
| `/api/roles/:id` | GET | Obtener rol por ID |
| `/api/roles/:id` | PUT | Actualizar rol |
| `/api/roles/:id` | DELETE | Eliminar rol (solo sin usuarios activos) |
| `/api/roles/:id/users` | POST | Asignar usuario al rol |
| `/api/roles/:id/users/:userId` | DELETE | Desasignar usuario del rol |

### ModulesModule (`/api/modules`)

CRUD de modulos funcionales con asignacion a roles.

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/modules` | GET | Lista de modulos |
| `/api/modules` | POST | Crear modulo |
| `/api/modules/:id` | GET | Obtener modulo por ID |
| `/api/modules/:id` | PUT | Actualizar modulo |
| `/api/modules/:id` | DELETE | Eliminar modulo |
| `/api/modules/:rolId/modules` | POST | Asignar modulo a rol |

### MenusModule (`/api/menus`)

CRUD de menus con estructura jerarquica recursiva (patron Adjacency List). Usa PostgreSQL `WITH RECURSIVE` para construir el arbol.

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/menus/tree` | GET | Arbol completo de menus (con hijos recursivos) |
| `/api/menus` | GET | Lista plana de menus |
| `/api/menus` | POST | Crear item de menu (con padre opcional) |
| `/api/menus/:id` | GET | Obtener menu por ID |
| `/api/menus/:id` | PUT | Actualizar menu |
| `/api/menus/:id` | DELETE | Eliminar menu |
| `/api/roles/:rolId/menus` | POST | Asignar menu a rol |

### InternalsModule (`/api/internals`)

Endpoint de validacion interna para microservicios hijos (Zero Trust).

| Endpoint | Metodo | Body | Descripcion |
|---|---|---|---|
| `/api/internals/validate-token` | POST | `{token}` | Valida un token JWT y devuelve los datos del usuario y rol |

---

## Modelo de Datos (Entidad-Relacion)

### BaseEntity (Clase Abstracta)

Todas las entidades heredan de `BaseEntity`:

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID (PK) | Identificador unico generado automaticamente |
| `estado` | varchar(20) | ACTIVO o INACTIVO (soft-delete) |
| `fecha_creacion` | timestamp | Fecha de creacion del registro |
| `fecha_actualizacion` | timestamp | Fecha de ultima actualizacion |
| `creado_por` | UUID | Usuario que creo el registro |
| `actualizado_por` | UUID | Usuario que actualizo el registro |

### Entidades

```
BaseEntity
  |
  +-- Usuario
  |     email: varchar(100) UNIQUE
  |     passwordHash: varchar(255) --> Argon2
  |     nombre: varchar(100)
  |     usuarioRoles: 1:N --> UsuarioRol
  |
  +-- Rol
  |     nombre: varchar(100) UNIQUE
  |     descripcion: text NULL
  |     usuarioRoles: 1:N --> UsuarioRol
  |     rolModulos: 1:N --> RolModulo
  |     rolMenus: 1:N --> RolMenu
  |
  +-- Modulo
  |     nombre: varchar(100) UNIQUE
  |     descripcion: text NULL
  |     rolModulos: 1:N --> RolModulo
  |     menus: 1:N --> Menu
  |
  +-- Menu
  |     nombre: varchar(100)
  |     url: varchar(500) NULL (solo nodos hoja)
  |     icono: varchar(100) NULL
  |     orden: integer
  |     modulo_id: FK --> Modulo
  |     parent_id: FK --> Menu (auto-referencia, NULL = raiz)
  |     hijos: 1:N --> Menu (recursivo)
  |     rolMenus: 1:N --> RolMenu
  |
  +-- UsuarioRol (pivot M:N)
  |     usuario_id: FK --> Usuario
  |     rol_id: FK --> Rol
  |
  +-- RolModulo (pivot M:N)
  |     rol_id: FK --> Rol
  |     modulo_id: FK --> Modulo
  |
  +-- RolMenu (pivot M:N)
        rol_id: FK --> Rol
        menu_id: FK --> Menu
```

### Relaciones Clave

| Relacion | Tipo | Tabla Pivot |
|---|---|---|
| Usuario - Rol | M:N | usuario_rol |
| Rol - Modulo | M:N | rol_modulo |
| Rol - Menu | M:N | rol_menu |
| Menu - Menu (padre) | 1:N (recursivo) | Menus.parent_id |

---

## Principios de Seguridad Implementados

| Principio | Implementacion |
|---|---|
| **Shift-Left Security** | Validacion en DTOs (whitelist + forbidNonWhitelisted), consultas parametrizadas via TypeORM, SAST en CI (SonarQube, CodeBERT, Trivy) |
| **Zero Trust Architecture** | Guards globales protegen TODAS las rutas por defecto (JwtAuthGuard), solo endpoints con decorador `@Public()` son accesibles sin token |
| **Minimo Privilegio** | El JWT contiene unicamente el `rolId` y `rolNombre` del rol seleccionado, no los roles globales del usuario |
| **Defense in Depth** | Hashing Argon2 + JWT + validacion DTO + guards + SAST pipeline |
| **Autenticacion Multifase** | TempToken de corta duracion (5 min) antes de emitir el JWT final |
| **Soft Delete** | Ningun registro se elimina fisicamente, solo cambia `estado` a INACTIVO |
| **Validacion Centralizada** | Microservicios hijos no implementan autenticacion propia; delegan en el Master Gateway via `/api/internals/validate-token` |

---

## Configuracion y Variables de Entorno

### Backend (`backend/.env`)

```
PORT=3000
JWT_SECRET=<clave-secreta-access-token>
JWT_TEMP_SECRET=<clave-secreta-temp-token>
JWT_REFRESH_SECRET=<clave-secreta-refresh-token>
DATABASE_URL=postgresql://usuario:password@host:5432/master_gateway
```

### Secrets de GitHub Actions

| Secret | Proposito |
|---|---|
| `JWT_SECRET` | Firma de access tokens |
| `DATABASE_URL` | Conexion a base de datos en produccion |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `TELEGRAM_TO` | Chat ID de Telegram para notificaciones |
| `HF_TOKEN` | Token de HuggingFace para CodeBERT |
| `PAT_GITHUB` | Personal Access Token para git operations |
| `RENDER_DEPLOY_HOOK` | Webhook de Render para deploy |
| `SONAR_HOST_URL` | URL del servidor SonarQube |
| `SONAR_TOKEN` | Token de autenticacion SonarQube |

---

## Docker

El `Dockerfile` en `backend/` usa multi-stage build:

```
Stage 1 (builder): node:22-alpine --> npm install --> npm run build
Stage 2 (runner):  node:22-alpine --> npm install --omit=dev --> copia dist/
EXPOSE 3000
CMD: node dist/seed && node dist/main
```

El contenedor ejecuta el seed de datos antes de iniciar la aplicacion.

---

## Inicio Rapido

### Requisitos

- Node.js 22+
- PostgreSQL 16+
- npm 10+

### Instalacion

```bash
# Clonar el repositorio
git clone <repo-url>
cd Master-Gateway

# Instalar dependencias (monorepo con npm workspaces)
npm install

# Configurar variables de entorno
# Crear backend/.env con las variables necesarias

# Inicializar la base de datos
# Crear la base de datos 'master_gateway' en PostgreSQL

# Iniciar en modo desarrollo
npm run start:backend   # Backend en http://localhost:3000
npm run start:frontend  # Frontend en http://localhost:3001
```

### Construir para produccion

```bash
docker build -t master-gateway backend/
docker run -p 3000:3000 --env-file backend/.env master-gateway
```

---

## Estructura del Proyecto

```
Master-Gateway/
│
├── backend/                     # API REST (NestJS 11)
│   ├── Dockerfile               # Multi-stage build
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts              # Bootstrap: CORS, ValidationPipe
│       ├── app.module.ts        # Modulo raiz con guards globales
│       ├── app.controller.ts    # GET / -> "Hello World!"
│       ├── seed.ts              # Seed de datos iniciales
│       ├── auth/                # Autenticacion (login, JWT, refresh)
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/jwt.strategy.ts
│       │   └── dto/             # login.dto, select-role.dto, refresh.dto
│       ├── users/               # CRUD usuarios con soft-delete
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── entities/usuario.entity.ts
│       │   └── dto/             # create-usuario, update-usuario
│       ├── roles/               # CRUD roles + asignacion M:N
│       │   ├── roles.module.ts
│       │   ├── roles.controller.ts
│       │   ├── roles.service.ts
│       │   ├── entities/        # rol.entity, usuario-rol.entity
│       │   └── dto/             # create-rol, update-rol, asignar-usuario
│       ├── modules/             # CRUD modulos + asignacion a roles
│       │   ├── modules.module.ts
│       │   ├── modules.controller.ts
│       │   ├── modules.service.ts
│       │   ├── entities/        # modulo.entity, rol-modulo.entity
│       │   └── dto/             # create-modulo, update-modulo, asignar-modulo-rol
│       ├── menus/               # CRUD menus + arbol recursivo (CTE)
│       │   ├── menus.module.ts
│       │   ├── menus.controller.ts
│       │   ├── menus.service.ts
│       │   ├── entities/        # menu.entity, rol-menu.entity
│       │   └── dto/             # create-menu, update-menu, asignar-menu-rol
│       ├── internals/           # Validacion Zero Trust para microservicios
│       │   ├── internals.module.ts
│       │   ├── internals.controller.ts
│       │   └── internals.service.ts
│       ├── common/              # Componentes compartidos
│       │   ├── entities/base.entity.ts
│       │   ├── guards/          # jwt-auth.guard, roles.guard
│       │   ├── decorators/      # roles, public, current-user
│       │   └── dto/pagination.dto.ts
│       └── config/              # database.config, jwt.config
│
├── frontend/                    # Aplicacion web (Next.js 16)
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/                  # Archivos estaticos
│   └── src/
│       ├── app/
│       │   ├── globals.css      # Estilos globales Tailwind
│       │   ├── layout.tsx       # Layout raiz con Toaster
│       │   ├── page.tsx         # Redirecciona a /login
│       │   ├── not-found.tsx    # Pagina 404
│       │   ├── login/page.tsx   # Formulario de inicio de sesion
│       │   ├── select-role/page.tsx  # Seleccion de rol
│       │   └── dashboard/       # Dashboard protegido
│       │       ├── layout.tsx   # Layout con Sidebar + AuthGuard
│       │       ├── page.tsx     # Pagina principal del dashboard
│       │       ├── users/       # CRUD usuarios (page, new, [id]/edit)
│       │       ├── roles/       # CRUD roles
│       │       ├── modules/     # CRUD modulos
│       │       └── menus/       # CRUD menus
│       ├── components/
│       │   ├── sidebar.tsx      # Sidebar con menu dinamico
│       │   ├── data-table.tsx   # Tabla generica con paginacion
│       │   └── ui/              # Componentes Radix UI
│       │       ├── avatar.tsx, badge.tsx, button.tsx
│       │       ├── card.tsx, dialog.tsx, dropdown-menu.tsx
│       │       ├── input.tsx, label.tsx, select.tsx
│       │       ├── separator.tsx, table.tsx
│       └── lib/
│           ├── api.ts           # Funciones de llamadas a la API
│           ├── api-client.ts    # Instancia Axios con interceptores
│           ├── auth-store.ts    # Store Zustand de autenticacion
│           ├── menu-store.ts    # Store Zustand del menu
│           ├── types.ts         # Interfaces TypeScript
│           └── utils.ts         # cn() utility
│
├── docs/                        # Documentacion
│   ├── ci-cd.md                 # Documentacion del pipeline CI/CD
│   └── images/
│       └── pipeline-architecture.jpeg  # Diagrama del pipeline
│
├── scripts/                     # Scripts de analisis SAST
│   ├── analyze_codebert.py      # Analisis ML con CodeBERT
│   └── analyze_vulnerabilities.py  # Escaneo de vulnerabilidades
│
├── .github/
│   └── workflows/
│       ├── build.yml            # CI: build, test, auto-merge
│       ├── sast.yml             # SAST: SonarQube, CodeBERT, Trivy
│       └── deploy.yml           # CD: deploy a Render
│
├── sonar-project.properties     # Configuracion SonarQube
├── PROYECTO_INTEGRADOR_MASTER_GATEWAY.md  # Documento del proyecto
├── package.json                 # Monorepo root (npm workspaces)
└── README.md                    # Este archivo
```