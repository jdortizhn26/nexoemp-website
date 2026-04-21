# 🔒 Despliegue de Reglas Firestore

Esta guía te lleva paso a paso para desplegar `firestore.rules` **sin quedarte afuera**.

---

## ⚠️ Pre-requisito CRÍTICO

Tu usuario actual debe tener su perfil en la colección `users` con `role: "admin"`.

Hoy la app te trata como admin incluso si no tenés perfil. Con las nuevas reglas, **sin perfil = sin acceso**.

### Paso 1: Confirmar tu perfil en Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/) → Tu proyecto → Firestore
2. Abre la colección `users`
3. Buscá el documento cuyo ID coincide con tu UID de Auth
   - ¿No sabés tu UID? → Console → Authentication → Users → copiá el UID de tu email
4. Verificá que el documento exista con al menos:

```json
{
  "role": "admin",
  "email": "tu@email.com",
  "createdAt": "2026-04-18T..."
}
```

### Paso 2: Si el documento NO existe, creálo

1. Firestore → `users` → **Add document**
2. Document ID: tu UID (copiado de Authentication)
3. Campos:

| Field       | Type    | Value                       |
|-------------|---------|-----------------------------|
| `role`      | string  | `admin`                     |
| `email`     | string  | tu email                    |
| `createdAt` | string  | (dejá en blanco o ISO date) |

**Guardá** y verificá que aparece.

---

## 📋 Desplegar las reglas

### Opción A — Firebase Console (recomendado, 2 minutos)

1. Firebase Console → Firestore → **Rules**
2. **Backup:** copiá el contenido actual a un archivo aparte por si necesitás rollback
3. Abrí `firestore.rules` en el proyecto y copiá TODO el contenido
4. Pegá en el editor de Firebase Console
5. Click **Publish**
6. Confirmá

### Opción B — Firebase CLI

Si tenés Firebase CLI configurado:

```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Verificación post-deploy

Después de publicar, abrí la app en una pestaña nueva y probá:

| Acción | Debería |
|--------|---------|
| Cargar Dashboard | ✅ Funcionar normalmente |
| Ingresar una venta | ✅ Guardar OK |
| Crear usuario nuevo | ✅ Aparecer en Usuarios |
| Ver bodega central | ✅ Ver stock |
| Aprobar requisición | ✅ Crea envío |

### ⚠️ Si algo falla

1. Abrí DevTools (F12) → Console
2. Buscá errores `PERMISSION_DENIED` o `Missing or insufficient permissions`
3. Si el error es en tu cuenta:
   - Revisá que tu perfil exista con `role: "admin"`
4. **Rollback rápido**: Firebase Console → Rules → History → seleccioná versión anterior → Publish

---

## 🧑‍🤝‍🧑 Crear usuarios de prueba

Después de confirmar que vos seguís teniendo acceso, creá usuarios de prueba **desde la app** (Menú → 👥 Usuarios):

1. **Admin de prueba** — para simular otro admin
2. **Encargado tienda** — rol `branch`, asignado a una sucursal
3. **Encargado inventario** — rol `inventory`, misma sucursal
4. **Franquiciado** — rol `franchisee`, con alguna(s) sucursal(es)
5. **Delegado** — creado por el franquiciado desde su propia sesión

Con cada uno, loguealo y verificá:
- ✅ Solo ve su scope
- ✅ Las acciones permitidas funcionan
- ❌ Las no permitidas devuelven error

---

## 🛡️ Lo que estas reglas bloquean

- Usuarios autenticados pero sin perfil → acceso denegado
- Un `branch` intentando crear venta de otra sucursal → rechazado
- Un `franchisee` viendo datos de una sucursal que no le pertenece → rechazado
- Cualquiera intentando modificar `config/warehouse` sin ser admin → rechazado
- Cualquiera intentando borrar una venta → rechazado (ni siquiera admin)
- Cualquier colección no listada en las reglas → denegado por default

---

## 📝 Changelog futuro

Si agregás nuevas colecciones (ej: `audit_logs`, `attendance`, etc.), tenés que:
1. Agregar su `match` en `firestore.rules`
2. Redeployar con los pasos de arriba

Si no las agregás, la regla default-deny al final bloqueará el acceso.
