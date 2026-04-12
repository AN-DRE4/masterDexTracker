UPDATE tracker_dexentry
SET image_url = REPLACE(
  image_url,
  'furfrou.png',
  'furfrou-' || LOWER(TRIM(SUBSTR(notes, 1, INSTR(notes, ' Trim') - 1))) || '.png'
)
WHERE name LIKE '%Furfrou%'
  AND notes LIKE '% Trim%'
  AND image_url LIKE '%furfrou.png';

SELECT id, name, notes, image_url,
       REPLACE(
         image_url,
         'furfrou.png',
         'furfrou-' || LOWER(TRIM(SUBSTR(notes, 1, INSTR(notes, ' Trim') - 1))) || '.png'
       ) AS new_image_url
FROM tracker_dexentry
WHERE name LIKE '%Furfrou%'
  AND notes LIKE '% Trim%'
  AND image_url LIKE '%furfrou.png';