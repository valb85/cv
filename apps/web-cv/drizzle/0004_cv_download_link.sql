-- Points the hero's "Download CV" button at the generated PDF. It was parked
-- on '#' (or left on a /cv.pdf that 404'd) while no PDF existed. Only a
-- placeholder or the old /cv.pdf is touched - a link set to anything else in
-- the admin is left alone.
UPDATE `blocks`
SET `data` = json_set(`data`, '$.secondaryHref', '/cv.pdf'),
    `updated_at` = unixepoch()
WHERE `type` = 'hero'
  AND json_extract(`data`, '$.secondaryLabel') IS NOT NULL
  AND json_extract(`data`, '$.secondaryLabel') LIKE '%CV%'
  AND coalesce(json_extract(`data`, '$.secondaryHref'), '') IN ('', '#', '/cv.pdf');
