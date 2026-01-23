-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'manager', 'ops', 'technician')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by all" 
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Profiles can be updated by all" 
ON public.profiles FOR UPDATE
USING (true);

CREATE POLICY "Profiles can be inserted by all" 
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Create reports table for generated reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_number TEXT UNIQUE,
  report_type TEXT NOT NULL CHECK (report_type IN ('prediction', 'maintenance', 'summary', 'monthly', 'equipment_analysis', 'cost_analysis')),
  title TEXT NOT NULL,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sections JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  recommendations TEXT[],
  metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'sent', 'archived')),
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by all" 
ON public.reports FOR SELECT
USING (true);

CREATE POLICY "Reports can be created by all" 
ON public.reports FOR INSERT
WITH CHECK (true);

-- Create function to generate report number
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.report_number := 'RPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for report number
CREATE TRIGGER set_report_number
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  WHEN (NEW.report_number IS NULL)
  EXECUTE FUNCTION public.generate_report_number();

-- Create index for faster queries
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_created ON public.reports(created_at DESC);

-- Insert sample profiles
INSERT INTO public.profiles (email, full_name, role, department) VALUES
  ('admin@providentia.farm', 'System Administrator', 'admin', 'IT'),
  ('john.manager@providentia.farm', 'John Smith', 'manager', 'Operations'),
  ('sarah.ops@providentia.farm', 'Sarah Johnson', 'ops', 'Field Operations'),
  ('mike.tech@providentia.farm', 'Mike Wilson', 'technician', 'Maintenance');

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();