-- ============================================================
-- PsicoApp — Datos de ejemplo (seed)
-- PASO 1: Ejecutar schema.sql primero
-- PASO 2: Registrarte en la app (crear tu cuenta)
-- PASO 3: Copiar tu USER_ID desde Supabase → Authentication → Users
-- PASO 4: Reemplazar 'REEMPLAZAR_CON_TU_USER_ID' con tu UUID
-- PASO 5: Ejecutar este archivo en SQL Editor
-- ============================================================

DO $$
DECLARE
  v_user_id   uuid := 'REEMPLAZAR_CON_TU_USER_ID';
  v_psych_id  uuid;
  v_pat1_id   uuid;
  v_pat2_id   uuid;
  v_pat3_id   uuid;
  v_apt1_id   uuid;
BEGIN

-- Obtener ID del psicólogo
SELECT id INTO v_psych_id FROM public.psychologists WHERE user_id = v_user_id;

-- Actualizar perfil
UPDATE public.psychologists SET
  full_name = 'Dra. Laura Martínez',
  license_number = 'MP 12345',
  phone = '+54 11 4567-8901',
  address = 'Av. Santa Fe 1234, Piso 3, CABA',
  brand_color = '#2563eb'
WHERE id = v_psych_id;

-- Insertar pacientes
INSERT INTO public.patients (psychologist_id, first_name, last_name, email, phone, date_of_birth, admin_notes, tags)
VALUES (v_psych_id, 'Martina', 'González', 'martina.gonzalez@email.com', '+54 11 1234-5678', '1990-03-15',
  'Derivada por médico clínico. Pago en efectivo. OSDE.', ARRAY['Ansiedad', 'TCC'])
RETURNING id INTO v_pat1_id;

INSERT INTO public.patients (psychologist_id, first_name, last_name, email, phone, date_of_birth, admin_notes, tags)
VALUES (v_psych_id, 'Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '+54 11 9876-5432', '1985-07-22',
  'Sesiones virtuales preferidas. Swiss Medical.', ARRAY['Duelo', 'Virtual'])
RETURNING id INTO v_pat2_id;

INSERT INTO public.patients (psychologist_id, first_name, last_name, email, phone, date_of_birth, tags)
VALUES (v_psych_id, 'Sofía', 'López', 'sofia.lopez@email.com', '+54 11 5555-1234', '1998-11-08', ARRAY['Autoestima'])
RETURNING id INTO v_pat3_id;

-- Insertar turno confirmado (mañana a las 9)
INSERT INTO public.appointments (psychologist_id, patient_id, scheduled_at, duration_minutes, modality, status, internal_notes)
VALUES (v_psych_id, v_pat1_id, NOW() + INTERVAL '1 day 9 hours' - make_interval(hours => EXTRACT(HOUR FROM NOW())::int),
  50, 'presencial', 'confirmed', 'Segunda sesión. Continuar con reestructuración cognitiva.')
RETURNING id INTO v_apt1_id;

-- Insertar turno pendiente (en 2 días)
INSERT INTO public.appointments (psychologist_id, patient_id, scheduled_at, duration_minutes, modality, status)
VALUES (v_psych_id, v_pat2_id, NOW() + INTERVAL '2 days 11 hours', 50, 'virtual', 'pending_confirmation');

-- Insertar turno cancelado (hace 5 días)
INSERT INTO public.appointments (psychologist_id, patient_id, scheduled_at, duration_minutes, modality, status, cancelled_reason, cancelled_at)
VALUES (v_psych_id, v_pat3_id, NOW() - INTERVAL '5 days 14 hours', 50, 'presencial', 'cancelled_by_patient',
  'Viaje laboral imprevisto', NOW() - INTERVAL '6 days');

-- Insertar nota de sesión
INSERT INTO public.session_notes (psychologist_id, patient_id, appointment_id, consultation_reason, development, interventions, observations, next_steps, session_date)
VALUES (
  v_psych_id, v_pat1_id, v_apt1_id,
  'Ansiedad generalizada e insomnio recurrente.',
  'La paciente refiere episodios de ansiedad principalmente nocturnos. Describe pensamientos intrusivos relacionados con el trabajo. Ha implementado las técnicas de respiración acordadas con resultados moderados. Se exploró la historia vincular y su relación con el patrón de exigencia.',
  'Técnica de respiración diafragmática. Reestructuración cognitiva de pensamientos automáticos negativos. Psicoeducación sobre el ciclo ansiedad-insomnio.',
  'La paciente muestra buen nivel de insight y vinculación terapéutica sólida. Se observa progreso en la identificación de patrones de pensamiento. Motivación alta.',
  'Continuar con registro de pensamientos automáticos. Introducir técnicas de mindfulness básico. Revisar higiene del sueño.',
  CURRENT_DATE - INTERVAL '7 days'
);

RAISE NOTICE 'Seed completado exitosamente para psych_id: %', v_psych_id;
END $$;
