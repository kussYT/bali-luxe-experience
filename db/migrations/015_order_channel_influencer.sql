DO $$ BEGIN
  ALTER TYPE order_channel ADD VALUE 'influencer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
