# PsicoApp — Sistema de Gestión Clínica para Psicólogos

Sistema completo de gestión de turnos, pacientes y notas de sesión.
Cada psicólogo tiene su cuenta independiente — los datos nunca se mezclan.

---

## PASO 1 — Abrir el proyecto en VS Code

1. Descomprimí `psicoapp.zip` en tu escritorio
2. Abrí **Visual Studio Code**
3. Menú **File → Open Folder** → seleccioná la carpeta `psico-app`
4. Abrí la terminal: menú **Terminal → New Terminal**

---

## PASO 2 — Crear el proyecto en Supabase

1. Entrá a https://supabase.com → **Start your project** → registrate
2. Click en **New project**
3. Completá:
   - **Name:** `psicoapp`
   - **Database Password:** inventá una y guardala
   - **Region:** `South America (São Paulo)`
4. Click **Create new project** — esperá ~2 minutos

---

## PASO 3 — Crear las tablas

1. En Supabase → **SQL Editor** (barra izquierda) → **New query**
2. En VS Code, abrí `supabase/schema.sql` → Ctrl+A → Ctrl+C
3. Pegalo en Supabase → click **Run**
4. Resultado: `Success. No rows returned` ✅

---

## PASO 4 — Copiar tus credenciales de Supabase

1. Supabase → **Settings** (engranaje abajo a la izquierda) → **API**
2. Copiá estos 3 valores y guardalos en un bloc de notas:

```
Project URL          → https://ALGO.supabase.co
anon public          → eyJhbGci... (larga)
service_role secret  → eyJhbGci... (más larga aún)
```

> NUNCA compartas la service_role. Tiene acceso total a la base de datos.

---

## PASO 5 — Crear cuenta en Resend (emails)

1. Entrá a https://resend.com → **Get Started** → registrate
2. **API Keys → Create API Key** → nombre: `psicoapp` → **Add**
3. Copiá la key (empieza con `re_`) — solo se muestra una vez

---

## PASO 6 — Crear el archivo .env.local

Este archivo guarda tus claves. Está dentro de la carpeta `psico-app`.

### Cómo crearlo:

**Con la terminal de VS Code** (recomendado):
```bash
cp .env.local.example .env.local
```

**Sin terminal:** En VS Code, en el panel izquierdo buscá `.env.local.example`,
click derecho → Rename → cambialo a `.env.local`

### Cómo completarlo:

Abrí `.env.local` en VS Code. Reemplazá cada línea con tus valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://TUPROYECTO.supabase.co
```
→ Pegá aquí tu **Project URL** de Supabase

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```
→ Pegá aquí la **anon public** key de Supabase

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```
→ Pegá aquí la **service_role secret** de Supabase

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
→ Dejalo exactamente así mientras trabajás en tu computadora

```
RESEND_API_KEY=re_xxxxxxxxxxxxxx
```
→ Pegá aquí tu key de Resend

```
RESEND_FROM_EMAIL=onboarding@resend.dev
```
→ Dejalo así por ahora (funciona para pruebas)

```
CRON_SECRET=psicoapp_clave_larga_inventada
```
→ Inventá cualquier texto largo (ej: `colegio_austin_psicoapp_2024`)

El archivo completo se ve así (con tus datos reales):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiO...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiO...
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_AbCdEfGhIjKlMnOpQrStUv
RESEND_FROM_EMAIL=onboarding@resend.dev
CRON_SECRET=colegio_austin_psicoapp_recordatorios_2024
```

Guardá el archivo con **Ctrl+S**.

---

## PASO 7 — Instalar y correr

En la terminal de VS Code:

```bash
npm install
```

Esperá que termine (1-2 minutos). Luego:

```bash
npm run dev
```

Vas a ver:
```
▲ Next.js 15
- Local: http://localhost:3000
```

Abrí tu navegador en **http://localhost:3000** — deberías ver el login. ✅

---

## PASO 8 — Deshabilitar confirmación de email (importante)

Por defecto Supabase exige confirmar el email al registrarse. Para uso interno es mejor deshabilitarlo:

1. Supabase → **Authentication** → **Providers** → **Email**
2. Desactivá **"Confirm email"**
3. Click **Save**

---

## PASO 9 — Crear tu cuenta y la de Laura

Ahora que la app corre, creá las cuentas:

**Tu cuenta (para probar):**
1. En http://localhost:3000 → click **"Registrate"**
2. Nombre: `Joaquín Alva` (o como quieras)
3. Email: `joaquin.alva@austinebs-ah.edu.ar`
4. Contraseña: la que quieras (mín. 8 caracteres)
5. Click **Crear cuenta** → entrás directo

**Cuenta de Laura:**
Cuando la app esté publicada en Vercel (Paso 10), mandále el link y estos pasos:
1. Entrar a la URL de la app
2. Click en **"Registrate"**
3. Nombre: `Dra. Laura Ballini`
4. Email: `laura.ballini@austinebs-ah.edu.ar`
5. Contraseña: la que ella elija
6. Completar su perfil en **Configuración** (matrícula, logo, color)

---

## PASO 10 — Publicar en internet (Vercel)

Para que Laura pueda acceder desde cualquier dispositivo:

### Subir el código a GitHub

1. Creá cuenta en https://github.com
2. Click **New repository** → `psicoapp` → **Create**
3. En la terminal de VS Code:

```bash
git init
git add .
git commit -m "PsicoApp"
git remote add origin https://github.com/TU_USUARIO/psicoapp.git
git push -u origin main
```

### Conectar con Vercel

1. Entrá a https://vercel.com → **Add New Project**
2. Importá tu repositorio `psicoapp`
3. Expandí **Environment Variables** y agregá una por una:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service_role key |
| `NEXT_PUBLIC_APP_URL` | Dejalo vacío por ahora |
| `RESEND_API_KEY` | Tu key de Resend |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` |
| `CRON_SECRET` | La misma que usaste en .env.local |

4. Click **Deploy** — esperá ~2 minutos
5. Vercel te da una URL tipo: `psicoapp-abc123.vercel.app`

### Actualizar la URL

1. Vercel → **Settings → Environment Variables** → editá `NEXT_PUBLIC_APP_URL`
2. Valor: `https://psicoapp-abc123.vercel.app` (tu URL real)
3. Vercel → **Deployments → ⋯ → Redeploy**

### Actualizar Supabase

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://psicoapp-abc123.vercel.app`
3. **Redirect URLs:** `https://psicoapp-abc123.vercel.app/**`
4. **Save**

---

## AGREGAR NUEVOS PSICÓLOGOS

No necesitás hacer nada técnico. Cada psicólogo se registra solo.

**Mensaje que podés mandarle a cualquier psicólogo nuevo:**

---

> Hola! Para acceder al sistema de gestión PsicoApp:
>
> 1. Entrá a: **https://psicoapp-abc123.vercel.app** (tu URL real)
> 2. Click en **"Registrate"**
> 3. Completá tu nombre completo, email profesional y una contraseña
> 4. ¡Listo! Ya podés usar el sistema
> 5. En **Configuración** (barra lateral) completá tu matrícula y subí tu logo
>
> Tus pacientes, turnos y notas son completamente privados.
> Ningún otro usuario puede ver tu información.

---

Si en algún momento necesitás **eliminar un usuario:**
1. Supabase → **Authentication → Users**
2. Buscá el email → click en los tres puntos `···` → **Delete user**

---

## RECORDATORIOS AUTOMÁTICOS

El sistema envía recordatorios 24hs antes de cada turno.

**Configuración gratuita con cron-job.org:**
1. Entrá a https://cron-job.org → registrate gratis
2. **Create cronjob**:
   - URL: `https://tu-app.vercel.app/api/reminders`
   - Método: `POST`
   - Header: `Authorization` = `Bearer TU_CRON_SECRET`
   - Horario: todos los días a las 10:00 UTC (07:00 Argentina)

---

## COMANDOS ÚTILES

```bash
npm run dev      # Correr localmente en http://localhost:3000
npm run build    # Compilar para producción
npm run lint     # Verificar errores de código
```

---

## PROBLEMAS FRECUENTES

**No puedo entrar después de registrarme**
→ Supabase → Authentication → Providers → Email → desactivá "Confirm email"

**Error al instalar (npm install falla)**
→ Verificá Node.js: en la terminal escribí `node --version` (necesitás v18+)
→ Descargá desde https://nodejs.org si no tenés

**Pantalla en blanco o error 500**
→ Revisá que `.env.local` tenga todos los valores completos sin espacios extra

**Los emails no llegan**
→ En desarrollo, Resend solo envía a emails registrados en tu cuenta de Resend
→ Para producción verificá tu dominio en Resend → Domains

**Error "relation does not exist"**
→ Ejecutá `supabase/schema.sql` completo nuevamente en el SQL Editor de Supabase
