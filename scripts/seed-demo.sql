-- Demo library for the hosted showcase.
--
-- Copies the 28 photographs from the development library into the demo
-- account, keeping every Gemini caption, tag, scene type and colour exactly
-- as the model produced them. The images themselves already live in
-- ImageKit, so these rows only point at them.
--
-- date_taken is demo data: stock images carry no EXIF date, and without one
-- the whole library groups under a single heading. created_at is the real
-- upload time. Nothing else is invented.
--
-- Safe to re-run: it clears the demo account's photos and albums first.
-- Run it in Neon's SQL Editor, or:
--   psql "$DATABASE_URL" -f scripts/seed-demo.sql

BEGIN;

\set demo_email 'demo@google-photos-clone.app'

-- Fails loudly rather than silently seeding nothing if the account is absent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@google-photos-clone.app') THEN
    RAISE EXCEPTION 'Register demo@google-photos-clone.app first, then re-run this script';
  END IF;
END $$;

-- Start from a clean slate so re-running resets the demo.
DELETE FROM album_photos WHERE album_id IN (SELECT a.id FROM albums a JOIN users u ON u.id = a.user_id WHERE u.email = 'demo@google-photos-clone.app');
UPDATE albums SET cover_photo_id = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');
DELETE FROM albums WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');
DELETE FROM shared_links WHERE photo_id IN (SELECT id FROM photos WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'));
DELETE FROM photos WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');

-- Photos ---------------------------------------------------------------
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('8695e40f-f9b6-4b4f-b398-84dbffa3c563', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'castle-garden_YUiJxHHH2.jpg', 'castle-garden.jpg', '6aab942aead997d09a8739bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'image/jpeg', 497072, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:02.313236+00', '2026-02-14 13:10:00+00', 'A wide shot of the grand Château de Chambord under a cloudy sky, with a long gravel path leading towards the entrance.', 'architecture, building, castle, chambord, chateau, clouds, french, historic, landmark, lawn, palace, path, sky', 'architecture', 'blue, green, gray, white', '2026-09-17 13:18:28.487179+00', 497072, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('cc37ce70-57cb-490c-b045-9f55243ad104', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'lighthouse_LAN9TeLpB.jpg', 'lighthouse.jpg', '6aab9421ead997d09a86e6cb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'image/jpeg', 326298, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.222918+00', '2025-10-11 11:40:00+00', 'A black and white photo of a lighthouse standing among rocks under a cloudy sky.', 'architecture, black and white, building, coast, historical, lighthouse, monochrome, rocks, scenic, tower', 'architecture', 'black, white, gray', '2026-09-17 13:20:00.8068+00', 326298, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('ade5383e-984a-4aa6-80ea-d77c7257cfb6', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'old-cabin_7yzKba5xz.jpg', 'old-cabin.jpg', '6aab9423ead997d09a86f783', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'image/jpeg', 894749, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.143861+00', '2025-10-11 14:15:00+00', 'A vintage green bicycle leans against the weathered wooden wall of a rustic shed with a peeling blue door.', 'architecture, bicycle, blue, door, green, old, rustic, shed, vintage, wall, wooden', 'architecture', 'brown, green, blue', '2026-09-17 13:19:39.918271+00', 894749, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('e188966f-b30d-4d1e-b855-719edaf0bda9', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'santorini-village_q2ExPCq3gO.jpg', 'santorini-village.jpg', '6aab9420ead997d09a86d73f', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'image/jpeg', 223506, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:52.604024+00', '2025-07-05 19:20:00+00', 'A scenic view of whitewashed cliffside buildings and traditional windmills in Oia, Santorini, Greece.', 'cycladic architecture, dome, greece, greek flag, mediterranean, oia, santorini, travel, whitewashed, windmill', 'architecture', 'white, light blue, beige', '2026-09-17 13:01:46.205245+00', 223506, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('ea49065b-c5d9-40ae-a8af-08efe43b3dab', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coffee-cup_MXJnXa6WP.jpg', 'coffee-cup.jpg', '6aab954eead997d09a91a980', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'image/jpeg', 73163, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.601914+00', '2025-07-05 08:05:00+00', 'A top-down view of a white ceramic mug filled with coffee on a vibrant red background.', 'beverage, caffeine, coffee, cup, drink, latte, mug, red background, top view, white', 'food', 'red, white, brown', '2026-09-17 13:18:15.083824+00', 73163, 1800, 1800);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('bf2725ba-3e22-4fdb-a5ee-18737c59b53d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'raspberries_IKq3fdzF5.jpg', 'raspberries.jpg', '6aab954eead997d09a91aa35', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'image/jpeg', 174787, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.651231+00', '2025-07-05 09:30:00+00', 'Several fresh raspberries sit on a rustic wooden surface against a warm, glowing golden background.', 'food, fresh, fruit, golden hour, nature, raspberries, summer, sweet, warm lighting, wooden surface', 'food', 'gold, red, white', '2026-09-17 13:17:43.517357+00', 174787, 1800, 1800);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('18cb045a-bdc6-4eb9-891e-cdd6b56ba2fa', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'beach-pier_adZdgwRGG.jpg', 'beach-pier.jpg', '6aab9424ead997d09a86fe27', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'image/jpeg', 517440, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.760332+00', '2025-06-21 18:45:00+00', 'A wooden pier stretches across calm turquoise water toward a thatched-roof pavilion under a hazy sky.', 'boardwalk, horizon, hut, ocean, pier, resort, sea, sky, tropical, vacation, water', 'landscape', 'blue, brown, white', '2026-09-17 13:19:32.987472+00', 517440, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('312ec7b3-5d53-464e-aafd-6d03b84eee3c', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-skyline-bay_PQK5Z7kkwP.jpg', 'city-skyline-bay.jpg', '6aab9422ead997d09a86ec0c', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'image/jpeg', 376594, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:54.919932+00', '2026-04-19 17:30:00+00', 'A person rowing a small boat on the water with the San Francisco skyline and a bridge in the background.', 'bay bridge, boat, cityscape, horizon, landmark, ocean, rowing, san francisco, skyline, water', 'landscape', 'blue, white, gray', '2026-09-17 13:19:47.921515+00', 376594, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('c16f7400-6ff0-4eb4-8261-13b42c3c27b5', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coast-forest-view_CNjKAvlp8H.jpg', 'coast-forest-view.jpg', '6aab941bead997d09a86ac36', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'image/jpeg', 505464, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-06-21 13:20:00+00', 'A scenic landscape featuring a dense green forest in the foreground, a vast blue body of water, and distant mountains under a clear sky.', 'forest, horizon, landscape, mountains, nature, ocean, outdoors, scenic, sea, sky, trees, water', 'landscape', 'blue, green, teal', '2026-09-17 13:21:09.895934+00', 505464, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('ca1eb764-3168-4b05-b08d-9000f98d243b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'desert-canyon_xFGy4Qp29j.jpg', 'desert-canyon.jpg', '6aab941eead997d09a86c487', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'image/jpeg', 358409, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:50.792337+00', '2026-04-19 09:45:00+00', 'A wide-angle landscape view showing rolling brown hills under a clear blue sky.', 'hills, horizon, landscape, mountains, nature, outdoors, panorama, scenery, sky, terrain, valley, wilderness', 'landscape', 'blue, brown, gold', '2026-09-17 13:20:31.623534+00', 358409, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('6d8451e7-cab7-429b-a364-e3e7bd57c669', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'forest-path_QoHGvwiAY.jpg', 'forest-path.jpg', '6aab941bead997d09a86ac2a', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'image/jpeg', 795140, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-10-11 10:50:00+00', 'A narrow gravel pathway winds through lush green grass toward a line of flowering trees and a dark forest under a bright blue sky.', 'blooming trees, forest, grass, landscape, nature, outdoors, pathway, spring, trail, trees, walkway', 'landscape', 'green, blue, gray, white', '2026-09-17 13:20:53.421362+00', 795140, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('80e8c97e-1e79-4b69-a535-701766c5a998', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'golden-sunset_0SC8i8n-5.jpg', 'golden-sunset.jpg', '6aab9427ead997d09a871e06', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'image/jpeg', 581261, 2800, 1200, 'ACTIVE', true, '2026-09-17 07:17:59.853078+00', '2025-10-11 18:05:00+00', 'A tranquil meadow with trees and grazing cattle under a vibrant golden sunset sky.', 'cows, fields, golden hour, grass, landscape, meadow, nature, sunrise, sunset, trees', 'landscape', 'gold, green, brown', '2026-09-17 13:18:55.974443+00', 581261, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('ebbceed3-433e-4988-98db-c9620b13780b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-glacier_oGXu4yX3n.jpg', 'mountain-glacier.jpg', '6aab941eead997d09a86c47d', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'image/jpeg', 1042418, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:50.788742+00', '2025-04-12 16:15:00+00', 'A breathtaking landscape view of snow-capped mountains under a clear blue sky.', 'blue sky, himalayas, landscape, mount everest, mountain, nature, outdoors, peaks, scenic, snow, valley, winter', 'landscape', 'blue, white, gray', '2026-09-17 13:20:41.109729+00', 1042418, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('3b535ff3-e02d-42aa-9089-187c552a863f', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-lake_HViqynBZu.jpg', 'mountain-lake.jpg', '6aab9429ead997d09a873577', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'image/jpeg', 509542, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:01.936969+00', '2025-04-12 08:20:00+00', 'A tranquil lake landscape with tall green reeds in the foreground, a wooden pier, and distant misty mountains under a soft sky.', 'horizon, lake, landscape, mountains, nature, pier, reeds, scenic, sunset, trees, water', 'landscape', 'blue, green, brown', '2026-09-17 13:18:35.030426+00', 509542, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('dea05105-8b15-4102-930f-0078ecc7540d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-valley_CK0nRkrFX.jpg', 'mountain-valley.jpg', '6aab941eead997d09a86c4c9', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'image/jpeg', 892629, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:50.822399+00', '2025-04-12 11:05:00+00', 'A scenic view looking down a rocky waterfall surrounded by lush green forest under a partly cloudy sky.', 'forest, green, landscape, nature, outdoors, rocks, scenic, sky, stream, trees, valley, waterfall', 'landscape', 'green, gray, blue, white', '2026-09-17 13:20:25.201521+00', 892629, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('98dbba60-01c4-4839-90f0-ecea05fae34c', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-waterfall_i_cqW52Rz.jpg', 'mountain-waterfall.jpg', '6aab941bead997d09a86aac4', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'image/jpeg', 520370, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-04-12 14:40:00+00', 'A tall waterfall cascades down a rocky, moss-covered cliff into a stream surrounded by dense green forest.', 'forest, landscape, moss, nature, rocks, stream, trees, water, waterfall, wilderness', 'landscape', 'green, gray, white', '2026-09-17 13:21:01.849735+00', 520370, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('79dd619c-15c6-4f11-9ff2-c0df1e8adcdc', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'summer-sky_TtPKOxLL7b.jpg', 'summer-sky.jpg', '6aab9420ead997d09a86daa3', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'image/jpeg', 328732, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.950628+00', '2025-04-12 17:30:00+00', 'A group of hikers stand triumphantly atop a rocky mountain peak against a bright blue sky filled with fluffy white clouds.', 'adventure, blue sky, clouds, group, hikers, mountain, nature, outdoors, peak, rocks, sky, summit', 'landscape', 'blue, white, brown, gray', '2026-09-17 13:20:08.451411+00', 328732, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('22a1b5f2-9362-4bc9-85d7-fd320796504f', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'turquoise-lake_LU5Ve-eBl.jpg', 'turquoise-lake.jpg', '6aab9428ead997d09a872381', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'image/jpeg', 363503, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:00.237656+00', '2025-06-21 10:10:00+00', 'A small orange fishing boat with a Greek flag floats in calm turquoise waters.', 'boat, calm, flag, greece, greek flag, nature, ocean, orange, sea, transportation, turquoise, water', 'landscape', 'turquoise, blue, orange, white', '2026-09-17 13:18:41.415074+00', 363503, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('3c7c28fd-c2c8-46d7-bf78-8b4a8a6623da', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'cherry-blossom_iP7QexZgY.jpg', 'cherry-blossom.jpg', '6aab9424ead997d09a86feeb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'image/jpeg', 283098, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:56.838992+00', '2026-02-14 12:25:00+00', 'A close-up view of delicate cherry blossoms blooming on tree branches against a soft background.', 'bloom, botanical, branches, cherry blossoms, floral, flowers, macro, nature, pink, plants, spring, tree, white', 'macro', 'white, pink, teal, brown', '2026-09-17 13:19:25.796278+00', 283098, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('48d7b4a1-675c-4122-b0ab-7e7c93681c26', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'purple-flower_kxViuY-z07.jpg', 'purple-flower.jpg', '6aab954eead997d09a91a9dd', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'image/jpeg', 203184, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:22:54.643243+00', '2026-02-14 15:40:00+00', 'A close-up shot of a vibrant purple flower with a water droplet on its petal.', 'bloom, close up, floral, flower, macro, nature, petal, plant, purple, water drop', 'macro', 'purple, green, black, yellow', '2026-09-17 13:18:09.562418+00', 203184, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('3ccd5412-350b-4c99-8e07-9bddba74ad05', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'bridge-at-night_F9O3foiFF.jpg', 'bridge-at-night.jpg', '6aab9425ead997d09a870cdb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'image/jpeg', 194567, 1600, 2400, 'ACTIVE', true, '2026-09-17 07:17:57.996976+00', '2025-08-17 22:40:00+00', 'A stunning low-angle view of a suspension bridge illuminated at night against a cloudy twilight sky.', 'architecture, bridge, clouds, engineering, illuminated, lights, night, sky, structure, suspension bridge, twilight', 'night', 'blue, gold, gray, black', '2026-09-17 13:19:19.286853+00', 194567, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('aad8ade8-aafe-4ad4-a0ae-f1896168950a', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-night-lights_ICginMZxY.jpg', 'city-night-lights.jpg', '6aab9427ead997d09a8720bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'image/jpeg', 249691, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:00.052673+00', '2025-08-17 21:35:00+00', 'A nighttime view of the Millennium Bridge illuminated against the London skyline with St. Paul''s Cathedral in the background.', 'architecture, bridge, cityscape, dark, lights, london, millennium bridge, night, river, st pauls cathedral', 'night', 'black, gray, white', '2026-09-17 13:18:48.383934+00', 249691, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('7199a94c-9725-449d-ace2-9587b24c907d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'canal-houses_SVz0hDvXs.jpg', 'canal-houses.jpg', '6aab942aead997d09a873b19', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'image/jpeg', 506173, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:02.514214+00', '2025-08-17 15:25:00+00', 'A scenic canal in Bruges, Belgium, lined with historic buildings, wooden walkways, and small boats.', 'architecture, belgium, boats, bruges, buildings, canal, european, historic, town, waterway', 'outdoor', 'blue, brown, white, gold', '2026-09-17 13:18:21.793684+00', 506173, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('a66233d5-d8a4-4b2c-9413-e9d85a71c231', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-street_hdwoTUCdS.jpg', 'city-street.jpg', '6aab9420ead997d09a86d9ea', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'image/jpeg', 596304, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.892554+00', '2025-08-17 17:50:00+00', 'A narrow cobblestone street lined with historic brick and stone buildings under a clear blue sky.', 'brick architecture, cityscape, cobblestone street, fire escapes, historic buildings, historic district, new york street, streetscape, sunlight, urban canyon', 'outdoor', 'blue, red, brown, gray', '2026-09-17 13:20:17.226673+00', 596304, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('6d1e0617-d7d9-4af3-bc37-173c61390633', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-traffic_j-hHiWHSK.jpg', 'city-traffic.jpg', '6aab9426ead997d09a871212', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'image/jpeg', 358166, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:58.398529+00', '2026-04-19 08:55:00+00', 'A high-angle black and white photograph captures heavy traffic flowing down a multi-lane city avenue bordered by palm trees and buildings.', 'aerial view, avenue, black and white, cars, city, palm trees, road, street, traffic, transportation, urban, vehicles', 'outdoor', 'black, white, gray', '2026-09-17 13:19:12.815776+00', 358166, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('10ff258b-4c7c-4d7e-aa2e-9e04fc8bca2e', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vineyard-grapes_pnrnyYOVx.jpg', 'vineyard-grapes.jpg', '6aab9422ead997d09a86e999', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'image/jpeg', 431383, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.681138+00', '2025-10-11 16:15:00+00', 'A close-up view of ripe dark grapes hanging on the vine amidst green and yellow leaves.', 'agriculture, cluster, fruit, grapes, harvest, leaves, nature, ripe, vine, vineyard, wine grapes', 'outdoor', 'green, purple, brown', '2026-09-17 13:19:54.525295+00', 431383, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('68b203e0-b601-4b47-8a36-20efe73ebed1', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'wildflowers_EU30_WzSQ.jpg', 'wildflowers.jpg', '6aab9426ead997d09a871470', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'image/jpeg', 348469, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:58.678441+00', '2025-07-05 11:15:00+00', 'Clusters of pink plumeria flowers bloom against a bright blue sky on a tree branch.', 'blooms, blue sky, branches, flora, flowers, frangipani, leaves, nature, outdoors, pink flowers, plumeria, sky, tree', 'outdoor', 'blue, pink, green, brown', '2026-09-17 13:19:06.41871+00', 348469, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('580db015-55a2-48f2-9eb2-9e28cd0dc6a8', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vintage-car_Z63LvZJlT.jpg', 'vintage-car.jpg', '6aab9550ead997d09a91c2d1', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'image/jpeg', 482444, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:22:56.323096+00', '2026-04-19 16:20:00+00', 'A vintage custom car with a California 1938 license plate parked on a city street.', 'antique, automotive, car show, city, classic car, custom car, hot rod, retro, street, transportation, vehicle, vintage car', 'vehicle', 'gold, brown, black, gray', '2026-09-17 13:18:02.826264+00', 482444, 2400, 1600);

-- Albums ---------------------------------------------------------------
INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('a7d58715-924f-4b70-9b1c-30d56e6aedba', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Landscapes', '3b535ff3-e02d-42aa-9089-187c552a863f', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('55f8d18f-9ad4-4cc7-968c-0201520c8708', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '3b535ff3-e02d-42aa-9089-187c552a863f', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('f456cb72-364d-4c16-a4b9-735bece97541', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '80e8c97e-1e79-4b69-a535-701766c5a998', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('2e4075d7-6f81-4e28-8385-c1f103ea1255', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '22a1b5f2-9362-4bc9-85d7-fd320796504f', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('2e477ebb-39ca-4eba-97af-e214c3f829c8', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', 'ebbceed3-433e-4988-98db-c9620b13780b', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('187a99b4-6ca9-4a1d-9e3c-c98b96d927c5', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', 'dea05105-8b15-4102-930f-0078ecc7540d', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('e33dbd20-238a-46f0-b039-b2c9e838da13', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '98dbba60-01c4-4839-90f0-ecea05fae34c', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('60ca5ed7-d3bb-4a8d-82b0-f4f8478ab9d7', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '79dd619c-15c6-4f11-9ff2-c0df1e8adcdc', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('3622af78-9198-4b04-88ba-4351f55db59c', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '18cb045a-bdc6-4eb9-891e-cdd6b56ba2fa', now(), 7);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('2a5f49fd-777d-4ee8-9f86-0530ffe6a881', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', 'c16f7400-6ff0-4eb4-8261-13b42c3c27b5', now(), 8);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('04c24163-b754-4a0c-8c58-85b3842526eb', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', 'ca1eb764-3168-4b05-b08d-9000f98d243b', now(), 9);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('3aaee614-7c81-43c2-b01a-a6732d8c3a62', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '6d8451e7-cab7-429b-a364-e3e7bd57c669', now(), 10);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('2a93b620-327e-4384-9e67-e7acd3eb4b17', 'a7d58715-924f-4b70-9b1c-30d56e6aedba', '312ec7b3-5d53-464e-aafd-6d03b84eee3c', now(), 11);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('93be885b-bff7-4d71-9d37-485cf7d0f9ee', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Architecture', 'e188966f-b30d-4d1e-b855-719edaf0bda9', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('707a5f6c-43ae-4696-b758-5f49796a187c', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', 'e188966f-b30d-4d1e-b855-719edaf0bda9', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('bdebfebb-5589-4ba9-a1a2-41617f39bf8f', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', '8695e40f-f9b6-4b4f-b398-84dbffa3c563', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cbd9a3e5-5e64-44fd-bd7b-6be36fbf1772', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', 'cc37ce70-57cb-490c-b045-9f55243ad104', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('61c286a0-8c5c-49c3-8730-62d1a77fbd95', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', 'ade5383e-984a-4aa6-80ea-d77c7257cfb6', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('94660460-2508-4c9d-bc60-e04c202e2890', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', 'a66233d5-d8a4-4b2c-9413-e9d85a71c231', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('adf0f53b-bf2f-4851-912f-9f3e5befc912', '93be885b-bff7-4d71-9d37-485cf7d0f9ee', '7199a94c-9725-449d-ace2-9587b24c907d', now(), 5);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('58b76742-0302-40f8-8f82-6098a05bc539', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Travel', '7199a94c-9725-449d-ace2-9587b24c907d', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('167cac79-4f17-4a0d-9443-a626b09994ea', '58b76742-0302-40f8-8f82-6098a05bc539', '7199a94c-9725-449d-ace2-9587b24c907d', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('25f65e07-9017-4ee4-9703-723a5601f390', '58b76742-0302-40f8-8f82-6098a05bc539', 'e188966f-b30d-4d1e-b855-719edaf0bda9', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('55da7079-3721-4d45-b6da-40044c95d49f', '58b76742-0302-40f8-8f82-6098a05bc539', 'aad8ade8-aafe-4ad4-a0ae-f1896168950a', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('98d87930-aa3c-49ba-a18c-4292dc4b5f72', '58b76742-0302-40f8-8f82-6098a05bc539', '3ccd5412-350b-4c99-8e07-9bddba74ad05', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('dd26283a-a3b5-406d-8909-c1af82f53320', '58b76742-0302-40f8-8f82-6098a05bc539', '312ec7b3-5d53-464e-aafd-6d03b84eee3c', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('053abe8c-c63d-4f12-aedf-82f99b836c29', '58b76742-0302-40f8-8f82-6098a05bc539', '18cb045a-bdc6-4eb9-891e-cdd6b56ba2fa', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('19505b51-fe27-42a4-8e0e-251370b748a4', '58b76742-0302-40f8-8f82-6098a05bc539', 'ca1eb764-3168-4b05-b08d-9000f98d243b', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('a972d111-2208-4d4a-be93-0557d7d33727', '58b76742-0302-40f8-8f82-6098a05bc539', '10ff258b-4c7c-4d7e-aa2e-9e04fc8bca2e', now(), 7);

COMMIT;

-- Expect: 28 photos, 8 starred, 3 albums (12 / 6 / 8 photos).
SELECT (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app') AS photos,
       (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app' AND p.starred) AS starred,
       (SELECT count(*) FROM albums a JOIN users u ON u.id = a.user_id WHERE u.email = 'demo@google-photos-clone.app') AS albums;
