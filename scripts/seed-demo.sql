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
VALUES ('2430fb6f-154b-41d7-ac21-c1d2e836cf11', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'castle-garden_YUiJxHHH2.jpg', 'castle-garden.jpg', '6aab942aead997d09a8739bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'image/jpeg', 497072, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:02.313236+00', '2026-03-08 13:10:00+00', 'A wide shot of the grand Château de Chambord under a cloudy sky, with a long gravel path leading towards the entrance.', 'architecture, building, castle, chambord, chateau, clouds, french, historic, landmark, lawn, palace, path, sky', 'architecture', 'blue, green, gray, white', '2026-09-17 13:18:28.487179+00', 497072, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('3d25e34c-65b7-4642-a356-d1e74c3cfa3f', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'lighthouse_LAN9TeLpB.jpg', 'lighthouse.jpg', '6aab9421ead997d09a86e6cb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'image/jpeg', 326298, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.222918+00', '2025-11-23 11:40:00+00', 'A black and white photo of a lighthouse standing among rocks under a cloudy sky.', 'architecture, black and white, building, coast, historical, lighthouse, monochrome, rocks, scenic, tower', 'architecture', 'black, white, gray', '2026-09-17 13:20:00.8068+00', 326298, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('1e586657-6388-4ccd-8115-3eab9f0e6a7b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'old-cabin_7yzKba5xz.jpg', 'old-cabin.jpg', '6aab9423ead997d09a86f783', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'image/jpeg', 894749, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.143861+00', '2025-11-23 14:15:00+00', 'A vintage green bicycle leans against the weathered wooden wall of a rustic shed with a peeling blue door.', 'architecture, bicycle, blue, door, green, old, rustic, shed, vintage, wall, wooden', 'architecture', 'brown, green, blue', '2026-09-17 13:19:39.918271+00', 894749, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('5293cc49-516d-49b2-9452-c1c4632b9321', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'santorini-village_q2ExPCq3gO.jpg', 'santorini-village.jpg', '6aab9420ead997d09a86d73f', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'image/jpeg', 223506, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:52.604024+00', '2025-07-05 19:20:00+00', 'A scenic view of whitewashed cliffside buildings and traditional windmills in Oia, Santorini, Greece.', 'cycladic architecture, dome, greece, greek flag, mediterranean, oia, santorini, travel, whitewashed, windmill', 'architecture', 'white, light blue, beige', '2026-09-17 13:01:46.205245+00', 223506, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('06a9462a-acce-4ea0-86e9-c1946a5fb3cf', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coffee-cup_MXJnXa6WP.jpg', 'coffee-cup.jpg', '6aab954eead997d09a91a980', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'image/jpeg', 73163, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.601914+00', '2025-07-06 08:05:00+00', 'A top-down view of a white ceramic mug filled with coffee on a vibrant red background.', 'beverage, caffeine, coffee, cup, drink, latte, mug, red background, top view, white', 'food', 'red, white, brown', '2026-09-17 13:18:15.083824+00', 73163, 1800, 1800);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('b79d00b5-5a38-47a6-91f3-bb9aaad6384d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'raspberries_IKq3fdzF5.jpg', 'raspberries.jpg', '6aab954eead997d09a91aa35', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'image/jpeg', 174787, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.651231+00', '2025-07-06 09:30:00+00', 'Several fresh raspberries sit on a rustic wooden surface against a warm, glowing golden background.', 'food, fresh, fruit, golden hour, nature, raspberries, summer, sweet, warm lighting, wooden surface', 'food', 'gold, red, white', '2026-09-17 13:17:43.517357+00', 174787, 1800, 1800);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('e69343de-c376-4715-915e-0dc6f3a2297e', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'beach-pier_adZdgwRGG.jpg', 'beach-pier.jpg', '6aab9424ead997d09a86fe27', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'image/jpeg', 517440, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.760332+00', '2025-06-21 18:45:00+00', 'A wooden pier stretches across calm turquoise water toward a thatched-roof pavilion under a hazy sky.', 'boardwalk, horizon, hut, ocean, pier, resort, sea, sky, tropical, vacation, water', 'landscape', 'blue, brown, white', '2026-09-17 13:19:32.987472+00', 517440, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('cce9cf94-2d79-4fbe-a26f-ada2008f536e', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-skyline-bay_PQK5Z7kkwP.jpg', 'city-skyline-bay.jpg', '6aab9422ead997d09a86ec0c', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'image/jpeg', 376594, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:54.919932+00', '2026-04-19 17:30:00+00', 'A person rowing a small boat on the water with the San Francisco skyline and a bridge in the background.', 'bay bridge, boat, cityscape, horizon, landmark, ocean, rowing, san francisco, skyline, water', 'landscape', 'blue, white, gray', '2026-09-17 13:19:47.921515+00', 376594, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('a27a7eba-1b74-48b4-834f-76dcc6f2cd90', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coast-forest-view_CNjKAvlp8H.jpg', 'coast-forest-view.jpg', '6aab941bead997d09a86ac36', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'image/jpeg', 505464, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-10-11 13:20:00+00', 'A scenic landscape featuring a dense green forest in the foreground, a vast blue body of water, and distant mountains under a clear sky.', 'forest, horizon, landscape, mountains, nature, ocean, outdoors, scenic, sea, sky, trees, water', 'landscape', 'blue, green, teal', '2026-09-17 13:21:09.895934+00', 505464, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('c5d66c53-3be0-48ea-98b0-eb5d06009674', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'desert-canyon_xFGy4Qp29j.jpg', 'desert-canyon.jpg', '6aab941eead997d09a86c487', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'image/jpeg', 358409, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:50.792337+00', '2026-04-19 09:45:00+00', 'A wide-angle landscape view showing rolling brown hills under a clear blue sky.', 'hills, horizon, landscape, mountains, nature, outdoors, panorama, scenery, sky, terrain, valley, wilderness', 'landscape', 'blue, brown, gold', '2026-09-17 13:20:31.623534+00', 358409, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('5db9cde5-b511-4609-8c4f-00810034767a', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'forest-path_QoHGvwiAY.jpg', 'forest-path.jpg', '6aab941bead997d09a86ac2a', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'image/jpeg', 795140, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-10-11 10:50:00+00', 'A narrow gravel pathway winds through lush green grass toward a line of flowering trees and a dark forest under a bright blue sky.', 'blooming trees, forest, grass, landscape, nature, outdoors, pathway, spring, trail, trees, walkway', 'landscape', 'green, blue, gray, white', '2026-09-17 13:20:53.421362+00', 795140, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('50ad981f-480f-4c58-aebc-a2651290b62a', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'golden-sunset_0SC8i8n-5.jpg', 'golden-sunset.jpg', '6aab9427ead997d09a871e06', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'image/jpeg', 581261, 2800, 1200, 'ACTIVE', true, '2026-09-17 07:17:59.853078+00', '2025-10-12 18:05:00+00', 'A tranquil meadow with trees and grazing cattle under a vibrant golden sunset sky.', 'cows, fields, golden hour, grass, landscape, meadow, nature, sunrise, sunset, trees', 'landscape', 'gold, green, brown', '2026-09-17 13:18:55.974443+00', 581261, 2800, 1200);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('136fa9c5-0802-490c-b779-fbc060d65e2e', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-glacier_oGXu4yX3n.jpg', 'mountain-glacier.jpg', '6aab941eead997d09a86c47d', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'image/jpeg', 1042418, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:50.788742+00', '2025-04-13 09:15:00+00', 'A breathtaking landscape view of snow-capped mountains under a clear blue sky.', 'blue sky, himalayas, landscape, mount everest, mountain, nature, outdoors, peaks, scenic, snow, valley, winter', 'landscape', 'blue, white, gray', '2026-09-17 13:20:41.109729+00', 1042418, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('00d542f5-c5a2-4558-919f-31442f67f1a5', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-lake_HViqynBZu.jpg', 'mountain-lake.jpg', '6aab9429ead997d09a873577', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'image/jpeg', 509542, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:01.936969+00', '2025-04-12 08:20:00+00', 'A tranquil lake landscape with tall green reeds in the foreground, a wooden pier, and distant misty mountains under a soft sky.', 'horizon, lake, landscape, mountains, nature, pier, reeds, scenic, sunset, trees, water', 'landscape', 'blue, green, brown', '2026-09-17 13:18:35.030426+00', 509542, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('48330e4c-0bf4-4504-90c6-4d2c5a505080', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-valley_CK0nRkrFX.jpg', 'mountain-valley.jpg', '6aab941eead997d09a86c4c9', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'image/jpeg', 892629, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:50.822399+00', '2025-04-12 11:05:00+00', 'A scenic view looking down a rocky waterfall surrounded by lush green forest under a partly cloudy sky.', 'forest, green, landscape, nature, outdoors, rocks, scenic, sky, stream, trees, valley, waterfall', 'landscape', 'green, gray, blue, white', '2026-09-17 13:20:25.201521+00', 892629, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('72980ae6-d5bd-44fd-9411-aa6037886be9', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-waterfall_i_cqW52Rz.jpg', 'mountain-waterfall.jpg', '6aab941bead997d09a86aac4', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'image/jpeg', 520370, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-04-12 14:40:00+00', 'A tall waterfall cascades down a rocky, moss-covered cliff into a stream surrounded by dense green forest.', 'forest, landscape, moss, nature, rocks, stream, trees, water, waterfall, wilderness', 'landscape', 'green, gray, white', '2026-09-17 13:21:01.849735+00', 520370, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('2bdff5d8-be1b-4625-805b-bc5823ac188b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'summer-sky_TtPKOxLL7b.jpg', 'summer-sky.jpg', '6aab9420ead997d09a86daa3', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'image/jpeg', 328732, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.950628+00', '2025-04-13 12:30:00+00', 'A group of hikers stand triumphantly atop a rocky mountain peak against a bright blue sky filled with fluffy white clouds.', 'adventure, blue sky, clouds, group, hikers, mountain, nature, outdoors, peak, rocks, sky, summit', 'landscape', 'blue, white, brown, gray', '2026-09-17 13:20:08.451411+00', 328732, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('bab6cadc-acfe-46d4-b3bc-6dc27882665b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'turquoise-lake_LU5Ve-eBl.jpg', 'turquoise-lake.jpg', '6aab9428ead997d09a872381', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'image/jpeg', 363503, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:00.237656+00', '2025-06-21 10:10:00+00', 'A small orange fishing boat with a Greek flag floats in calm turquoise waters.', 'boat, calm, flag, greece, greek flag, nature, ocean, orange, sea, transportation, turquoise, water', 'landscape', 'turquoise, blue, orange, white', '2026-09-17 13:18:41.415074+00', 363503, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('1947e950-4908-4395-bc27-f16fb556dd61', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'cherry-blossom_iP7QexZgY.jpg', 'cherry-blossom.jpg', '6aab9424ead997d09a86feeb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'image/jpeg', 283098, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:56.838992+00', '2026-02-14 12:25:00+00', 'A close-up view of delicate cherry blossoms blooming on tree branches against a soft background.', 'bloom, botanical, branches, cherry blossoms, floral, flowers, macro, nature, pink, plants, spring, tree, white', 'macro', 'white, pink, teal, brown', '2026-09-17 13:19:25.796278+00', 283098, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('a8d778fc-d8fc-4f87-a8ed-b8ad108e539d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'purple-flower_kxViuY-z07.jpg', 'purple-flower.jpg', '6aab954eead997d09a91a9dd', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'image/jpeg', 203184, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:22:54.643243+00', '2026-02-14 15:40:00+00', 'A close-up shot of a vibrant purple flower with a water droplet on its petal.', 'bloom, close up, floral, flower, macro, nature, petal, plant, purple, water drop', 'macro', 'purple, green, black, yellow', '2026-09-17 13:18:09.562418+00', 203184, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('fe067046-e11b-48b3-b846-c45a6af20a0a', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'bridge-at-night_F9O3foiFF.jpg', 'bridge-at-night.jpg', '6aab9425ead997d09a870cdb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'image/jpeg', 194567, 1600, 2400, 'ACTIVE', true, '2026-09-17 07:17:57.996976+00', '2025-08-18 22:40:00+00', 'A stunning low-angle view of a suspension bridge illuminated at night against a cloudy twilight sky.', 'architecture, bridge, clouds, engineering, illuminated, lights, night, sky, structure, suspension bridge, twilight', 'night', 'blue, gold, gray, black', '2026-09-17 13:19:19.286853+00', 194567, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('8be75423-a858-4f03-ae85-5453b2c9372f', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-night-lights_ICginMZxY.jpg', 'city-night-lights.jpg', '6aab9427ead997d09a8720bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'image/jpeg', 249691, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:00.052673+00', '2025-08-18 21:35:00+00', 'A nighttime view of the Millennium Bridge illuminated against the London skyline with St. Paul''s Cathedral in the background.', 'architecture, bridge, cityscape, dark, lights, london, millennium bridge, night, river, st pauls cathedral', 'night', 'black, gray, white', '2026-09-17 13:18:48.383934+00', 249691, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('91d4cc27-5386-4f75-903a-d2905529baf4', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'canal-houses_SVz0hDvXs.jpg', 'canal-houses.jpg', '6aab942aead997d09a873b19', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'image/jpeg', 506173, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:02.514214+00', '2025-08-17 15:25:00+00', 'A scenic canal in Bruges, Belgium, lined with historic buildings, wooden walkways, and small boats.', 'architecture, belgium, boats, bruges, buildings, canal, european, historic, town, waterway', 'outdoor', 'blue, brown, white, gold', '2026-09-17 13:18:21.793684+00', 506173, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('005f567d-345b-49af-9115-76934dd7066e', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-street_hdwoTUCdS.jpg', 'city-street.jpg', '6aab9420ead997d09a86d9ea', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'image/jpeg', 596304, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.892554+00', '2025-08-17 17:50:00+00', 'A narrow cobblestone street lined with historic brick and stone buildings under a clear blue sky.', 'brick architecture, cityscape, cobblestone street, fire escapes, historic buildings, historic district, new york street, streetscape, sunlight, urban canyon', 'outdoor', 'blue, red, brown, gray', '2026-09-17 13:20:17.226673+00', 596304, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('afddec84-cf86-4dc2-a1a5-96a20fea48f6', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-traffic_j-hHiWHSK.jpg', 'city-traffic.jpg', '6aab9426ead997d09a871212', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'image/jpeg', 358166, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:58.398529+00', '2026-05-30 08:55:00+00', 'A high-angle black and white photograph captures heavy traffic flowing down a multi-lane city avenue bordered by palm trees and buildings.', 'aerial view, avenue, black and white, cars, city, palm trees, road, street, traffic, transportation, urban, vehicles', 'outdoor', 'black, white, gray', '2026-09-17 13:19:12.815776+00', 358166, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('0c9b5726-2ca1-42ee-bf0f-305315eaa5c5', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vineyard-grapes_pnrnyYOVx.jpg', 'vineyard-grapes.jpg', '6aab9422ead997d09a86e999', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'image/jpeg', 431383, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.681138+00', '2025-09-02 16:15:00+00', 'A close-up view of ripe dark grapes hanging on the vine amidst green and yellow leaves.', 'agriculture, cluster, fruit, grapes, harvest, leaves, nature, ripe, vine, vineyard, wine grapes', 'outdoor', 'green, purple, brown', '2026-09-17 13:19:54.525295+00', 431383, 1600, 2400);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('38ab8f71-8a7a-4766-9760-9a06ce699431', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'wildflowers_EU30_WzSQ.jpg', 'wildflowers.jpg', '6aab9426ead997d09a871470', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'image/jpeg', 348469, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:58.678441+00', '2026-06-15 11:15:00+00', 'Clusters of pink plumeria flowers bloom against a bright blue sky on a tree branch.', 'blooms, blue sky, branches, flora, flowers, frangipani, leaves, nature, outdoors, pink flowers, plumeria, sky, tree', 'outdoor', 'blue, pink, green, brown', '2026-09-17 13:19:06.41871+00', 348469, 2400, 1600);
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at,
  exif_file_size, exif_width, exif_height)
VALUES ('1f6e0da1-4549-4d25-a566-dfb9b34a0533', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vintage-car_Z63LvZJlT.jpg', 'vintage-car.jpg', '6aab9550ead997d09a91c2d1', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'image/jpeg', 482444, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:22:56.323096+00', '2026-05-30 16:20:00+00', 'A vintage custom car with a California 1938 license plate parked on a city street.', 'antique, automotive, car show, city, classic car, custom car, hot rod, retro, street, transportation, vehicle, vintage car', 'vehicle', 'gold, brown, black, gray', '2026-09-17 13:18:02.826264+00', 482444, 2400, 1600);

-- Albums ---------------------------------------------------------------
INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('52c3de78-49dd-414b-ae7a-69ed7605bdd7', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Landscapes', '00d542f5-c5a2-4558-919f-31442f67f1a5', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('daeae0ae-8faf-41a5-94cd-61ea2bf5b850', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '00d542f5-c5a2-4558-919f-31442f67f1a5', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('241769d9-38c9-47da-be34-ca7546a6030f', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '50ad981f-480f-4c58-aebc-a2651290b62a', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('b12acf0a-f573-4c06-b578-61fcfd65fb8f', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', 'bab6cadc-acfe-46d4-b3bc-6dc27882665b', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('98934347-1bd2-45de-b231-89830b0f9148', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '136fa9c5-0802-490c-b779-fbc060d65e2e', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('44e7c033-f25f-4c03-9ecc-b9602752d986', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '48330e4c-0bf4-4504-90c6-4d2c5a505080', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('c78aa1af-a570-4bed-92ee-faa85f7167fd', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '72980ae6-d5bd-44fd-9411-aa6037886be9', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('3933eeb1-6cba-46aa-a007-aa36042707a6', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '2bdff5d8-be1b-4625-805b-bc5823ac188b', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('54a0d54f-cb29-49f1-9536-88cb10536c3a', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', 'e69343de-c376-4715-915e-0dc6f3a2297e', now(), 7);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cb85f323-178e-453f-b32f-ad31eadfeaab', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', 'a27a7eba-1b74-48b4-834f-76dcc6f2cd90', now(), 8);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('711cf184-ed84-4b20-9cb2-19987233d0fd', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', 'c5d66c53-3be0-48ea-98b0-eb5d06009674', now(), 9);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('a634493b-99af-4da3-803a-2d4f52354c7f', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', '5db9cde5-b511-4609-8c4f-00810034767a', now(), 10);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('d6fba526-f661-4c4e-a5d5-28f60582fc40', '52c3de78-49dd-414b-ae7a-69ed7605bdd7', 'cce9cf94-2d79-4fbe-a26f-ada2008f536e', now(), 11);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('0463df4a-fe71-48aa-9a0d-2cae21ef1796', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Architecture', '5293cc49-516d-49b2-9452-c1c4632b9321', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cbae6a8a-3658-4050-8865-b0f31fac0b3c', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '5293cc49-516d-49b2-9452-c1c4632b9321', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('0c3846b3-fcb8-4fba-9f51-3f961bf2b0c9', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '2430fb6f-154b-41d7-ac21-c1d2e836cf11', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cccaea01-63a1-4da0-bd50-53b8111b2dbe', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '3d25e34c-65b7-4642-a356-d1e74c3cfa3f', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('c72c46c1-fbac-450e-8af0-6916e39796a0', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '1e586657-6388-4ccd-8115-3eab9f0e6a7b', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('ce28e08b-c12b-487c-9d7c-c880f3934103', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '005f567d-345b-49af-9115-76934dd7066e', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('d48f0324-54c1-45b5-858b-a0c35b389605', '0463df4a-fe71-48aa-9a0d-2cae21ef1796', '91d4cc27-5386-4f75-903a-d2905529baf4', now(), 5);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('f2fa18e5-7bd5-4c15-a093-64cff0de76f4', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Travel', '91d4cc27-5386-4f75-903a-d2905529baf4', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('e55b48c4-7a26-40ee-8c47-98f48ec87d29', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', '91d4cc27-5386-4f75-903a-d2905529baf4', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('d75b9378-f41d-4b12-b3cc-888dae1a10f9', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', '5293cc49-516d-49b2-9452-c1c4632b9321', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('f073fe9a-d050-4def-81df-e61b98684ae7', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', '8be75423-a858-4f03-ae85-5453b2c9372f', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('e84b289a-a5c5-4eb4-9831-b4fa885f580b', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', 'fe067046-e11b-48b3-b846-c45a6af20a0a', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('b37b015c-6953-47ce-984a-3f9ac406acde', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', 'cce9cf94-2d79-4fbe-a26f-ada2008f536e', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('6b63b1e4-8f70-4e53-b03f-af2422ff5214', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', 'e69343de-c376-4715-915e-0dc6f3a2297e', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('6abe6d69-9bc9-43c3-be20-a20f67240ff7', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', 'c5d66c53-3be0-48ea-98b0-eb5d06009674', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('70b2ce7d-9fb0-41c6-918e-cadbb48c5e51', 'f2fa18e5-7bd5-4c15-a093-64cff0de76f4', '0c9b5726-2ca1-42ee-bf0f-305315eaa5c5', now(), 7);

COMMIT;

-- Expect: 28 photos, 8 starred, 3 albums (12 / 6 / 8 photos).
SELECT (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app') AS photos,
       (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app' AND p.starred) AS starred,
       (SELECT count(*) FROM albums a JOIN users u ON u.id = a.user_id WHERE u.email = 'demo@google-photos-clone.app') AS albums;
