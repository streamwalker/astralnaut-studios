UPDATE public.milestones
SET rewards = '[{"at": 250, "reward": "Steam cards (sweepstakes prize)"}, {"at": 500, "reward": "Signed prints (sweepstakes prize)"}, {"at": 750, "reward": "Wacom tablet (sweepstakes prize)"}, {"at": 1000, "reward": "PlayStation 5 (sweepstakes prize, single winner)"}]'::jsonb
WHERE id = '1977ff64-b697-4ec9-8ff7-094ef7fe2f07';