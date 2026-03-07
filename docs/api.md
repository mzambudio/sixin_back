# API del backend

## Visión general

Este documento describe los endpoints HTTP actualmente expuestos por `sixin_back`.

Todos los endpoints protegidos utilizan autenticación mediante Firebase ID token enviado en la cabecera:

```http
Authorization: Bearer <token>
```

La validación del token se realiza mediante Firebase Admin en `requireUser.ts`.

---

## Autenticación

### Mecanismo utilizado

Los endpoints protegidos esperan una cabecera:

```http
Authorization: Bearer <token>
```

### Validación

El backend:

1. extrae el token desde la cabecera
2. valida su formato
3. lo verifica mediante `auth().verifyIdToken(...)`
4. obtiene el `uid` autenticado

### Errores posibles

- `401 Missing Authorization Bearer token`
- `401 Invalid token`

---

## `GET /api/whoami`

### Descripción

Devuelve el `uid` del usuario autenticado.

### Objetivo

Se utiliza como endpoint simple de verificación para comprobar que:

- el token enviado es válido
- la autenticación entre frontend y backend funciona correctamente

### Requiere autenticación

Sí.

### Respuesta correcta

```json
{
  "ok": true,
  "uid": "user_uid"
}
```

### Respuestas de error

#### Token ausente o inválido

```json
{
  "ok": false,
  "error": "Missing Authorization Bearer token"
}
```

o

```json
{
  "ok": false,
  "error": "Invalid token"
}
```

---

## `DELETE /api/lists/:listId`

### Descripción

Elimina una lista concreta desde servidor.

### Objetivo

Este endpoint se usa para realizar un borrado controlado de listas cuando no basta con borrar solo el documento principal desde cliente.

### Requiere autenticación

Sí.

### Requisitos previos

El usuario autenticado debe ser administrador de la lista.

### Parámetros de ruta

- `listId`: identificador de la lista a eliminar

### Validaciones realizadas

El endpoint comprueba:

1. que el método HTTP sea `DELETE`
2. que `listId` sea válido
3. que el usuario esté autenticado
4. que la lista exista
5. que el usuario autenticado sea administrador

### Proceso de borrado actual

Una vez superadas las validaciones, el endpoint realiza:

1. borrado de `lists/{listId}/members`
2. borrado de `lists/{listId}/requests`
3. borrado de `list_codes/{joinCodeHash}` si existe
4. borrado del documento principal `lists/{listId}`

### Respuesta correcta

```json
{
  "ok": true
}
```

### Respuestas de error

#### Método no permitido

Código: `405`

```json
{
  "ok": false,
  "error": "Method not allowed"
}
```

Además, la respuesta incluye:

```http
Allow: DELETE
```

#### `listId` inválido

Código: `400`

```json
{
  "ok": false,
  "error": "Invalid listId"
}
```

#### Lista no encontrada

Código: `404`

```json
{
  "ok": false,
  "error": "List not found"
}
```

#### Usuario no autorizado

Código: `403`

```json
{
  "ok": false,
  "error": "Not allowed"
}
```

#### Error de autenticación

Código: `401`

```json
{
  "ok": false,
  "error": "Missing Authorization Bearer token"
}
```

o

```json
{
  "ok": false,
  "error": "Invalid token"
}
```

#### Error interno

Código: `500`

```json
{
  "ok": false,
  "error": "Server error"
}
```

---

## Notas de diseño

### 1. La autorización depende del array `admins`
Actualmente el endpoint considera administrador a un usuario cuyo `uid` aparece dentro del array `admins` del documento de lista.

### 2. `createdBy` se lee pero no se usa
El endpoint extrae el campo `createdBy`, pero la autorización efectiva se basa en `admins.includes(uid)`.

### 3. El borrado no es todavía completamente genérico
La lógica actual elimina solo las subcolecciones y referencias que el endpoint conoce expresamente. Si el modelo de datos crece, habrá que actualizar este endpoint para incluir nuevas limpiezas.

### 4. `deleteCollection` trabaja por lotes
Esto evita intentar borrar demasiados documentos de una sola vez y permite limpiar colecciones por páginas.

---

## Resumen

La API actual de `sixin_back` es pequeña y está enfocada a dos responsabilidades concretas:

- validar identidad autenticada
- ejecutar borrados controlados de listas desde servidor

A medida que el backend crezca, este documento deberá ampliarse con nuevos endpoints, parámetros y reglas de autorización.