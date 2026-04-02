-- Enable RLS on core project tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;

-- 1. Properties: Owners can manage their own properties
CREATE POLICY "Users can manage their own properties"
ON properties
FOR ALL
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- 2. Projects: Owners of the parent property can manage projects
CREATE POLICY "Users can manage projects of their own properties"
ON projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = projects.property_id
    AND properties.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = projects.property_id
    AND properties.owner_user_id = auth.uid()
  )
);

-- 3. Scope Items: Owners of the parent project can manage scope items
CREATE POLICY "Users can manage scope items of their own projects"
ON scope_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    JOIN properties ON projects.property_id = properties.id
    WHERE projects.id = scope_items.project_id
    AND properties.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    JOIN properties ON projects.property_id = properties.id
    WHERE projects.id = scope_items.project_id
    AND properties.owner_user_id = auth.uid()
  )
);
