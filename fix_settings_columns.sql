-- Add missing columns to GlobalSettings table
ALTER TABLE "GlobalSettings" ADD COLUMN IF NOT EXISTS "fiveSimApiKey" TEXT;
ALTER TABLE "GlobalSettings" ADD COLUMN IF NOT EXISTS "grizzlyApiKey" TEXT;

-- Ensure exchange rate and fixed profit columns exist (they should, but for safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GlobalSettings' AND column_name='fixedProfitNGN') THEN
        ALTER TABLE "GlobalSettings" ADD COLUMN "fixedProfitNGN" DOUBLE PRECISION DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GlobalSettings' AND column_name='smsExchangeRate') THEN
        ALTER TABLE "GlobalSettings" ADD COLUMN "smsExchangeRate" DOUBLE PRECISION DEFAULT 1550;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GlobalSettings' AND column_name='smsProvider') THEN
        ALTER TABLE "GlobalSettings" ADD COLUMN "smsProvider" TEXT DEFAULT 'FIVESIM';
    END IF;
END $$;
