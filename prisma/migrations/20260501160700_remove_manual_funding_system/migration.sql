-- Remove manual funding system schema objects.
DROP TABLE IF EXISTS "ManualFundingRequest" CASCADE;
DROP TYPE IF EXISTS "ManualFundingStatus";
