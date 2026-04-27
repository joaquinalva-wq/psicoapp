-- Agregar columnas de portal público al perfil del profesional
ALTER TABLE public.psychologists
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profession text DEFAULT 'Psicólogo/a',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS office_name text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS office_city text,
  ADD COLUMN IF NOT EXISTS office_province text,
  ADD COLUMN IF NOT EXISTS consultation_fee text,
  ADD COLUMN IF NOT EXISTS accepts_insurance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_list text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_days integer[] DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS available_from time DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS available_to time DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS slot_duration integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_web text;

-- Tabla de reservas desde el portal
CREATE TABLE IF NOT EXISTS public.public_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  psychologist_id uuid REFERENCES public.psychologists(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_first_name text NOT NULL,
  patient_last_name text NOT NULL,
  patient_email text NOT NULL,
  patient_phone text,
  reason text,
  requested_at timestamptz NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.public_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_psychologist" ON public.public_bookings
  USING (psychologist_id IN (
    SELECT id FROM public.psychologists WHERE user_id = auth.uid()
  ));

CREATE POLICY "bookings_public_insert" ON public.public_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "bookings_service_select" ON public.public_bookings
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_psychologists_slug ON public.psychologists(slug);
CREATE INDEX IF NOT EXISTS idx_psychologists_public ON public.psychologists(is_public);
CREATE INDEX IF NOT EXISTS idx_psychologists_city ON public.psychologists(office_city);
CREATE INDEX IF NOT EXISTS idx_bookings_psychologist ON public.public_bookings(psychologist_id);

-- Función para generar slug
CREATE OR REPLACE FUNCTION generate_slug(name text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(
    regexp_replace(
      translate(name,
        'áéíóúàèìòùäëïöüñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÑ',
        'aeiouaeiouaeiounAEIOUAEIOUAEIOUN'),
      '[^a-z0-9\s]', '', 'g'
    )
  );
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.psychologists WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar slug automáticamente
CREATE OR REPLACE FUNCTION set_slug_if_empty()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS psychologists_set_slug ON public.psychologists;
CREATE TRIGGER psychologists_set_slug
  BEFORE INSERT OR UPDATE ON public.psychologists
  FOR EACH ROW EXECUTE PROCEDURE set_slug_if_empty();

-- Generar slugs para profesionales existentes
UPDATE public.psychologists
SET slug = generate_slug(full_name)
WHERE slug IS NULL OR slug = '';