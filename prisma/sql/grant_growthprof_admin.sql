-- Ensure this user can access admin side.
UPDATE "User"
SET role = 'ADMIN'
WHERE lower(email) = 'growthprofesors@gmail.com';
