# Pipeline CI/CD

## Descripción

El proyecto implementa un pipeline de **Integración Continua (CI)** y **Despliegue Continuo (CD)** mediante **GitHub Actions**, automatizando la validación del código, pruebas, análisis de seguridad y despliegue.

## Estrategia de ramas

```text
feature/* → dev → test → main
```

* **feature/**: desarrollo de nuevas funcionalidades.
* **dev**: integración del desarrollo.
* **test**: validación y análisis de seguridad.
* **main**: entorno de producción.

## Workflows

### build.yml

Realiza las tareas de integración continua:

* Validación de Pull Requests.
* Instalación de dependencias.
* Lint.
* Build del proyecto.
* Pruebas unitarias con cobertura.
* Auto-merge entre ramas cuando se cumplen las reglas.
* Notificaciones mediante Telegram.

### sast.yml

Ejecuta el análisis de seguridad del proyecto:

* SonarQube.
* CodeBERT (Hugging Face).
* Trivy.
* Verificación del Quality Gate.
* Generación de reportes.

### deploy.yml

Despliega automáticamente la aplicación cuando existe un **push** a la rama **main**.

* Notificación de inicio.
* Despliegue mediante webhook de Render.
* Notificación del resultado.

## Arquitectura

<p align="center">
  <img src="./images/pipeline-architecture.png" alt="Arquitectura del Pipeline CI/CD" width="1000">
</p>

## Flujo general

1. El desarrollador crea una rama `feature/*`.
2. Se realiza un Pull Request hacia `dev`.
3. El pipeline ejecuta compilación y pruebas.
4. El código promovido a `test` ejecuta el análisis SAST.
5. Si todas las validaciones son exitosas, el pipeline realiza el auto-merge hacia `main`.
6. El despliegue se ejecuta automáticamente en Render y se envían notificaciones a Telegram.

## Herramientas utilizadas

* GitHub Actions
* SonarQube
* CodeBERT
* Trivy
* Telegram Bot
* Render
