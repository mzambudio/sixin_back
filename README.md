# Sixin Back

## Descripción general

`Sixin Back` es el backend de Sixin, desarrollado con Next.js API Routes y TypeScript.

Este repositorio centraliza la lógica de servidor que no conviene ejecutar únicamente en el cliente, especialmente operaciones sensibles que requieren privilegios de Firebase Admin o validaciones adicionales de seguridad.

Actualmente su responsabilidad principal es:

- validar usuarios autenticados mediante Firebase ID tokens
- exponer endpoints protegidos
- eliminar listas de forma controlada desde servidor
- ofrecer un endpoint auxiliar para comprobar la identidad autenticada

## Relación con el resto del proyecto

Sixin está dividido en dos repositorios independientes:

- **sixin_front**: frontend desarrollado con Flutter
- **sixin_back**: backend desarrollado con Next.js API Routes

Este repositorio corresponde únicamente a **`sixin_back`**.

## Tecnologías utilizadas

- **Framework:** Next.js
- **Lenguaje:** TypeScript
- **Infraestructura:** Firebase Admin SDK
- **Despliegue:** Vercel

## Objetivo del backend

Aunque gran parte de la lógica de Sixin se apoya directamente en Firebase desde el frontend, este backend existe para cubrir operaciones que requieren una capa de servidor.

En el estado actual del proyecto, el backend se utiliza para:

- verificar tokens Bearer enviados por el frontend
- autorizar acciones protegidas en función del usuario autenticado
- ejecutar borrados más seguros sobre Firestore
- encapsular lógica administrativa que no debe depender solo del cliente

## Estado del proyecto

Proyecto pequeño y enfocado, actualmente orientado a cubrir necesidades concretas del frontend.

## Instalación y ejecución

### Requisitos

Para trabajar con este proyecto se recomienda tener instalado:

- Node.js
- npm
- un proyecto Firebase configurado correctamente
- variables de entorno en `.env.local`

### Instalación

1. Clonar este repositorio.
2. Entrar en la carpeta del proyecto.
3. Instalar dependencias:

```bash
npm install
```

### Ejecución en desarrollo

```bash
npm run dev
```

### Build

```bash
npm run build
npm run start
```

## Despliegue

El backend de Sixin se despliega en Vercel.

Para que el despliegue funcione correctamente, es necesario configurar en Vercel las variables de entorno usadas por Firebase Admin.

## Variables de entorno

Este proyecto utiliza un archivo:

```bash
.env.local
```

### Variables necesarias para Firebase Admin

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Nota importante sobre la clave privada

La variable `FIREBASE_PRIVATE_KEY` se normaliza internamente antes de inicializar Firebase Admin. La implementación actual admite tanto claves con saltos de línea escapados (`\\n`) como claves pegadas con saltos reales de línea.

## Estructura del proyecto

```text
sixin_back/
├── public/
├── src/
│   ├── lib/
│   │   ├── deleteCollection.ts
│   │   ├── firebaseAdmin.ts
│   │   └── requireUser.ts
│   └── pages/
│       ├── api/
│       │   ├── lists/
│       │   │   └── [listId].ts
│       │   └── whoami.ts
│       ├── _app.tsx
│       ├── _document.tsx
│       └── index.tsx
├── styles/
├── .env.local
├── package.json
├── tsconfig.json
└── README.md
```

## Organización principal

### `src/pages/api/`

Contiene los endpoints expuestos por el backend mediante API Routes de Next.js.

### `src/lib/`

Contiene utilidades compartidas y lógica interna del backend.

### `public/`

Archivos estáticos del proyecto.

### `styles/`

Estilos de la parte web de Next.js.

## Utilidades internas principales

### `src/lib/firebaseAdmin.ts`

Centraliza la inicialización de Firebase Admin SDK.

Sus responsabilidades son:

- leer variables de entorno necesarias
- normalizar la clave privada de Firebase Admin
- inicializar la aplicación de Firebase Admin solo una vez
- exponer accesos reutilizables a:
  - Firestore
  - Firebase Auth

Funciones expuestas:

- `getAdminApp()`
- `db()`
- `auth()`

## `src/lib/requireUser.ts`

Utility de autenticación para endpoints protegidos.

Su función es:

- leer la cabecera `Authorization`
- extraer un token Bearer
- validarlo mediante `auth().verifyIdToken(...)`
- devolver el `uid` autenticado y el token decodificado

Si el token no existe o no es válido, lanza un error con estado `401`.

## `src/lib/deleteCollection.ts`

Utility para eliminar documentos de una colección de Firestore en lotes.

Características:

- trabaja por páginas usando `FieldPath.documentId()`
- permite configurar el tamaño del lote
- borra documentos mediante batch writes
- está pensada para colecciones o subcolecciones donde no basta con borrar solo el documento padre

## Endpoints disponibles

### `GET /api/whoami`

Endpoint protegido que devuelve el `uid` del usuario autenticado.

Uso principal:

- pruebas
- diagnóstico
- verificación de que el token Bearer enviado desde el cliente es válido

### `DELETE /api/lists/:listId`

Endpoint protegido para eliminar una lista desde servidor.

Actualmente realiza estas operaciones:

1. valida el método HTTP
2. valida el parámetro `listId`
3. autentica al usuario mediante Bearer token
4. comprueba que la lista existe
5. comprueba que el usuario autenticado sea administrador de la lista
6. elimina subcolecciones asociadas:
   - `lists/{listId}/members`
   - `lists/{listId}/requests`
   - `lists/{listId}/preview_access`
7. elimina el documento de `list_codes/{joinCodeHash}` si existe
8. elimina el documento principal de la lista

## Relación con el frontend

El frontend de Sixin delega en este backend aquellas operaciones que requieren mayor control o una ejecución más apropiada desde servidor.

Ejemplo actual:

- borrado de listas mediante petición `DELETE` autenticada con token Bearer

## Seguridad

La seguridad del backend se apoya principalmente en:

- verificación de Firebase ID tokens con Firebase Admin
- validación explícita del método HTTP permitido
- comprobación del rol de administrador antes de borrar listas
- uso de lógica de servidor para operaciones destructivas

## Limitaciones actuales

En su estado actual, el backend está centrado en un conjunto reducido de endpoints y responsabilidades.

A medida que el modelo de datos crezca, cualquier nueva subcolección o relación que deba limpiarse al borrar una lista tendrá que añadirse explícitamente a la lógica del endpoint correspondiente.

## Documentación adicional

- [API del backend](docs/api.md)

## Visión de futuro

A medida que Sixin crezca, este backend puede asumir nuevas responsabilidades, como:

- lógica relacionada con pagos
- operaciones administrativas más complejas
- validaciones adicionales de seguridad
- mantenimiento de consistencia entre múltiples colecciones
- endpoints específicos para flujos que no deban depender solo del cliente